"""人脸识别 API"""
import os
import time
import hashlib
import numpy as np
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from extensions import db
from models.patient import Patient
from services.face_service import face_service
from utils.auth import token_required

face_bp = Blueprint('face', __name__, url_prefix='/api/v1/face')

# 配置
UPLOAD_FOLDER = 'uploads/face_images'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

# 简单的图像哈希缓存(5分钟内有效)
face_recognition_cache = {}
CACHE_TTL = 300  # 5分钟


def get_image_hash(image_data: str) -> str:
    """计算图像数据的 MD5 哈希"""
    return hashlib.md5(image_data.encode()).hexdigest()


def allowed_file(filename):
    """检查文件扩展名是否允许"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@face_bp.route('/enroll', methods=['POST'])
@token_required
def enroll_face():
    """录入患者人脸（管理端使用）

    Request:
        - patient_no: 患者编号
        - image: 图片文件

    Response:
        - code: 200/400/404/500
        - message: 提示信息
    """
    # 验证患者编号
    patient_no = request.form.get('patient_no')
    print(f"[FaceAPI] 收到人脸录入请求: patient_no={patient_no}")

    if not patient_no:
        print("[FaceAPI] 错误: 缺少患者编号")
        return jsonify({'code': 400, 'message': '缺少患者编号'}), 400

    # 查询患者
    patient = Patient.query.filter_by(patient_no=patient_no).first()
    if not patient:
        print(f"[FaceAPI] 错误: 患者不存在 (patient_no={patient_no})")
        return jsonify({'code': 404, 'message': '患者不存在'}), 404

    # 验证图片文件
    if 'image' not in request.files:
        print("[FaceAPI] 错误: 缺少图片文件")
        return jsonify({'code': 400, 'message': '缺少图片文件'}), 400

    file = request.files['image']
    if file.filename == '':
        print("[FaceAPI] 错误: 未选择文件")
        return jsonify({'code': 400, 'message': '未选择文件'}), 400

    if not allowed_file(file.filename):
        print(f"[FaceAPI] 错误: 不支持的文件格式 (filename={file.filename})")
        return jsonify({'code': 400, 'message': '不支持的文件格式，仅支持 PNG/JPG'}), 400

    try:
        # 读取图片数据
        image_bytes = file.read()
        print(
            f"[FaceAPI] 图片大小: {len(image_bytes)} bytes ({len(image_bytes) / 1024:.2f} KB)")

        # 检查文件大小
        if len(image_bytes) > MAX_FILE_SIZE:
            print(
                f"[FaceAPI] 错误: 图片过大 ({len(image_bytes)} bytes > {MAX_FILE_SIZE})")
            return jsonify({'code': 400, 'message': '图片大小不能超过 5MB'}), 400

        # 提取人脸特征
        embedding = face_service.extract_feature_from_bytes(image_bytes)

        if embedding is None:
            print("[FaceAPI] ❌ 未检测到人脸")
            return jsonify({'code': 400, 'message': '未检测到人脸，请确保照片清晰且面部完整'}), 400

        # 验证特征质量
        if not face_service._validate_embedding(embedding):
            print("[FaceAPI] ❌ 人脸特征质量不合格")
            return jsonify({'code': 400, 'message': '人脸特征质量不合格，请重新拍摄'}), 400

        print(
            f"[FaceAPI] ✅ 人脸特征提取成功: {patient.name}, 维度: {len(embedding)}, 范数: {np.linalg.norm(embedding):.6f}")

        # 保存人脸照片
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        filename = secure_filename(f"{patient_no}_{patient.id}.jpg")
        save_path = os.path.join(UPLOAD_FOLDER, filename)

        with open(save_path, 'wb') as f:
            f.write(image_bytes)

        # 更新数据库
        patient.face_descriptor = embedding.tobytes()
        patient.face_image_path = save_path
        db.session.commit()

        return jsonify({
            'code': 200,
            'message': '人脸录入成功',
            'data': {
                'patient_no': patient_no,
                'patient_name': patient.name,
                'embedding_dimension': len(embedding)
            }
        })

    except Exception as e:
        db.session.rollback()
        print(f"[FaceAPI] 人脸录入失败: {e}")
        return jsonify({'code': 500, 'message': f'录入失败: {str(e)}'}), 500


@face_bp.route('/verify', methods=['POST'])
@token_required
def verify_face():
    """验证人脸特征（测试用）

    Request:
        - image: 图片文件

    Response:
        - code: 200/400
        - data: 人脸检测结果
    """
    if 'image' not in request.files:
        return jsonify({'code': 400, 'message': '缺少图片文件'}), 400

    file = request.files['image']

    try:
        image_bytes = file.read()
        embedding = face_service.extract_feature_from_bytes(image_bytes)

        if embedding is None:
            return jsonify({'code': 400, 'message': '未检测到人脸'}), 400

        return jsonify({
            'code': 200,
            'message': '人脸检测成功',
            'data': {
                'embedding_dimension': len(embedding),
                'embedding_sample': embedding[:5].tolist()  # 返回前 5 个值作为示例
            }
        })

    except Exception as e:
        print(f"[FaceAPI] 人脸验证失败: {e}")
        return jsonify({'code': 500, 'message': f'验证失败: {str(e)}'}), 500


@face_bp.route('/recognize', methods=['POST'])
def recognize_face():
    """人脸识别登录（患者端使用，无需 token）

    Request:
        - face_descriptor: 人脸特征向量数组 (512 维)

    Response:
        - code: 200/404
        - data: 患者信息
    """
    data = request.get_json()

    if not data or 'face_descriptor' not in data:
        return jsonify({'code': 400, 'message': '缺少人脸特征数据'}), 400

    try:
        query_embedding = np.array(data['face_descriptor'], dtype=np.float32)

        if query_embedding.shape[0] != 512:
            return jsonify({'code': 400, 'message': '特征向量维度错误，应为 512 维'}), 400

        # 查询所有已录入人脸的患者
        patients = Patient.query.filter(
            Patient.face_descriptor.isnot(None)).all()

        if not patients:
            return jsonify({'code': 404, 'message': '系统中暂无已录入人脸的患者'}), 404

        # 准备存储的特征向量列表
        stored_embeddings = []
        for patient in patients:
            if patient.face_descriptor:
                emb = np.frombuffer(patient.face_descriptor, dtype=np.float32)
                stored_embeddings.append((patient.id, emb))

        # 匹配人脸
        result = face_service.match_face(
            query_embedding, stored_embeddings, threshold=0.5)  # 降低阈值从 0.6 到 0.5

        if result:
            patient_id, similarity = result
            patient = Patient.query.get(patient_id)

            if patient:
                return jsonify({
                    'code': 200,
                    'message': '识别成功',
                    'data': {
                        'patient_id': patient.id,
                        'patient_no': patient.patient_no,
                        'name': patient.name,
                        'similarity': round(float(similarity), 4)
                    }
                })

        return jsonify({'code': 404, 'message': '未识别到患者，请重试或联系管理员'}), 404

    except Exception as e:
        print(f"[FaceAPI] 人脸识别失败: {e}")
        return jsonify({'code': 500, 'message': f'识别失败: {str(e)}'}), 500


@face_bp.route('/recognize-from-image', methods=['POST'])
def recognize_from_image():
    """从图片识别人脸（前端摄像头捕获）

    Request:
        - image_data: base64 编码的图片数据

    Response:
        - code: 200/404
        - data: 患者信息
    """
    import base64
    import cv2
    import numpy as np
    import time

    start_time = time.time()

    data = request.get_json()

    if not data or 'image_data' not in data:
        return jsonify({'code': 400, 'message': '缺少图片数据'}), 400

    try:
        # 解析 base64 图片
        image_data = data['image_data']
        if ',' in image_data:
            image_data = image_data.split(',')[1]

        # 检查缓存
        image_hash = get_image_hash(image_data)
        current_time = time.time()

        if image_hash in face_recognition_cache:
            cached_result, cached_time = face_recognition_cache[image_hash]
            if current_time - cached_time < CACHE_TTL:
                print(f"[FaceAuth] 使用缓存结果 (哈希: {image_hash[:8]}...)")
                return jsonify(cached_result)

        image_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if frame is None:
            return jsonify({'code': 400, 'message': '图片解码失败'}), 400

        # 检测并提取人脸特征
        print(f"[FaceAuth] ========== 开始识别 ==========")
        print(f"[FaceAuth] 图像尺寸: {frame.shape}")
        result = face_service.recognize_from_frame(frame)

        if result is None:
            print(f"[FaceAuth] ❌ 未检测到人脸")
            return jsonify({'code': 404, 'message': '未检测到人脸，请确保面部清晰可见'}), 404

        query_embedding, face_info = result
        print(f"[FaceAuth] ✅ 检测到人脸, 特征维度: {query_embedding.shape}")
        print(f"[FaceAuth] 人脸框: {face_info.get('bbox')}")

        # 查询所有已录入人脸的患者
        patients = Patient.query.filter(
            Patient.face_descriptor.isnot(None)).all()

        print(f"[FaceAuth] 数据库中有 {len(patients)} 个已录入人脸的患者")

        if not patients:
            print(f"[FaceAuth] ❌ 系统中暂无已录入人脸的患者")
            return jsonify({'code': 404, 'message': '系统中暂无已录入人脸的患者'}), 404

        # 准备存储的特征向量列表
        stored_embeddings = []
        for patient in patients:
            if patient.face_descriptor:
                emb = np.frombuffer(patient.face_descriptor, dtype=np.float32)
                stored_embeddings.append((patient.id, emb))

        print(f"[FaceAuth] 准备匹配 {len(stored_embeddings)} 个人脸特征")

        # 匹配人脸
        match_result = face_service.match_face(
            query_embedding, stored_embeddings, threshold=0.5)

        response_data = None

        if match_result:
            patient_id, similarity = match_result
            print(
                f"[FaceAuth] 🔍 匹配结果: 患者ID={patient_id}, 相似度={similarity:.4f}")

            patient = Patient.query.get(patient_id)

            if patient:
                total_time = time.time() - start_time

                # 性能监控
                if total_time > 3.0:
                    print(f"[FaceAuth] ⚠️ 性能告警: 识别耗时过长 ({total_time:.1f}s)")
                elif total_time < 0.5:
                    print(f"[FaceAuth] 🚀 极速识别: {total_time * 1000:.0f}ms")

                print(
                    f"[FaceAuth] ✅ 识别成功: {patient.name}, 相似度: {similarity:.4f}, 耗时: {total_time * 1000:.0f}ms")

                response_data = {
                    'code': 200,
                    'message': '识别成功',
                    'data': {
                        'patient_id': patient.id,
                        'patient_no': patient.patient_no,
                        'name': patient.name,
                        'similarity': round(float(similarity), 4),
                        # 人脸边界框 [x1, y1, x2, y2]
                        'face_bbox': face_info.get('bbox'),
                        'face_kps': face_info.get('kps'),    # 人脸关键点
                        # 人脸截图 (base64)
                        'face_image': face_info.get('face_image')
                    }
                }
            else:
                print(f"[FaceAuth] ❌ 患者 ID {patient_id} 在数据库中不存在")
        else:
            print(f"[FaceAuth] ❌ 未找到匹配的患者 (阈值: 0.5)")

        # 即使识别失败，也返回人脸框信息（用于前端绘制）
        if response_data is None:
            response_data = {
                'code': 404,
                'message': '未识别到患者，请重试或联系管理员',
                'data': {
                    'face_bbox': face_info.get('bbox'),
                    'face_kps': face_info.get('kps'),
                    'face_image': face_info.get('face_image')
                }
            }

        # 缓存成功结果
        if response_data['code'] == 200:
            face_recognition_cache[image_hash] = (response_data, current_time)
            # 清理过期缓存
            expired_keys = [
                k for k, v in face_recognition_cache.items()
                if current_time - v[1] >= CACHE_TTL
            ]
            for key in expired_keys:
                del face_recognition_cache[key]
            print(f"[FaceAuth] 缓存更新: 当前缓存数量={len(face_recognition_cache)}")

        status_code = 200 if response_data['code'] == 200 else 404
        return jsonify(response_data), status_code

    except Exception as e:
        print(f"[FaceAPI] 图片识别失败: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'code': 500, 'message': f'识别失败: {str(e)}'}), 500


@face_bp.route('/status/<int:patient_id>', methods=['GET'])
@token_required
def get_face_status(patient_id):
    """查询患者人脸录入状态

    Response:
        - has_face: 是否已录入
        - face_image_path: 人脸照片路径
    """
    patient = Patient.query.get(patient_id)

    if not patient:
        return jsonify({'code': 404, 'message': '患者不存在'}), 404

    return jsonify({
        'code': 200,
        'data': {
            'has_face': patient.face_descriptor is not None,
            'face_image_path': patient.face_image_path
        }
    })


@face_bp.route('/remove/<int:patient_id>', methods=['DELETE'])
@token_required
def remove_face(patient_id):
    """删除患者人脸数据

    Response:
        - code: 200/404
    """
    patient = Patient.query.get(patient_id)

    if not patient:
        return jsonify({'code': 404, 'message': '患者不存在'}), 404

    try:
        # 删除人脸照片文件
        if patient.face_image_path and os.path.exists(patient.face_image_path):
            os.remove(patient.face_image_path)

        # 清空数据库字段
        patient.face_descriptor = None
        patient.face_image_path = None
        db.session.commit()

        return jsonify({'code': 200, 'message': '人脸数据已删除'})

    except Exception as e:
        db.session.rollback()
        print(f"[FaceAPI] 删除人脸数据失败: {e}")
        return jsonify({'code': 500, 'message': f'删除失败: {str(e)}'}), 500
