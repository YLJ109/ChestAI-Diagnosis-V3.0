"""人脸识别审计日志模型"""
from datetime import datetime
from extensions import db


class FaceRecognitionLog(db.Model):
    """人脸识别操作日志表"""
    __tablename__ = 'face_recognition_logs'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    # 识别类型: 'patient' 或 'staff'
    recognition_type = db.Column(db.String(20), nullable=False, index=True)

    # 关联ID
    target_id = db.Column(db.Integer, nullable=True)  # patient_id 或 user_id
    target_name = db.Column(db.String(100), nullable=True)  # 患者姓名或用户姓名

    # 识别结果
    success = db.Column(db.Boolean, nullable=False, default=False)
    similarity = db.Column(db.Float, nullable=True)  # 相似度分数
    threshold = db.Column(db.Float, nullable=True)  # 识别阈值

    # 性能数据
    recognition_time_ms = db.Column(db.Float, nullable=True)  # 识别耗时(毫秒)
    feature_dimension = db.Column(db.Integer, nullable=True)  # 特征维度

    # 图像质量指标
    face_count = db.Column(db.Integer, nullable=True)  # 检测到的人脸数量
    # 人脸框大小 (width x height)
    face_size = db.Column(db.String(50), nullable=True)
    image_quality = db.Column(db.Float, nullable=True)  # 图像质量评分 (0-1)

    # 错误信息
    error_message = db.Column(db.Text, nullable=True)

    # 请求信息
    ip_address = db.Column(db.String(50), nullable=True)
    user_agent = db.Column(db.String(200), nullable=True)

    # 时间戳
    created_at = db.Column(
        db.DateTime, default=datetime.utcnow, nullable=False, index=True)

    def to_dict(self):
        return {
            'id': self.id,
            'recognition_type': self.recognition_type,
            'target_id': self.target_id,
            'target_name': self.target_name,
            'success': self.success,
            'similarity': round(self.similarity, 4) if self.similarity else None,
            'threshold': self.threshold,
            'recognition_time_ms': round(self.recognition_time_ms, 2) if self.recognition_time_ms else None,
            'feature_dimension': self.feature_dimension,
            'face_count': self.face_count,
            'face_size': self.face_size,
            'image_quality': round(self.image_quality, 4) if self.image_quality else None,
            'error_message': self.error_message,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at else None
        }
