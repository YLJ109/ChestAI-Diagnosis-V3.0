"""患者门户API - 专用接口（与医护系统隔离）"""
from datetime import datetime
from flask import Blueprint, request, jsonify
from extensions import db
from models.patient import Patient
from models.diagnosis import Diagnosis, DiseaseProbability
from models.report import Report
from models.triage import TriageRecord
from utils.auth import token_required

patient_portal_bp = Blueprint(
    'patient_portal', __name__, url_prefix='/api/v1/patient')


@patient_portal_bp.route('/dashboard', methods=['GET'])
@token_required
def patient_dashboard():
    """患者门户首页数据概览"""
    patient_id = request.current_user_id

    # 患者基本信息
    patient = Patient.query.get(patient_id)
    if not patient:
        return jsonify({'code': 404, 'message': '患者信息不存在'}), 404

    # 统计数据
    total_diagnoses = Diagnosis.query.filter_by(patient_id=patient_id).count()
    pending_reports = db.session.query(Report).join(Diagnosis).filter(
        Diagnosis.patient_id == patient_id,
        Report.status == 'draft'
    ).count()
    reviewed_reports = db.session.query(Report).join(Diagnosis).filter(
        Diagnosis.patient_id == patient_id,
        Report.status.in_(['approved', 'reviewed'])
    ).count()
    triage_count = TriageRecord.query.filter_by(patient_id=patient_id).count()

    # 最近一次诊断
    latest = Diagnosis.query.filter_by(patient_id=patient_id)\
        .order_by(Diagnosis.created_at.desc()).first()

    latest_info = None
    if latest:
        top_prob = DiseaseProbability.query.filter_by(diagnosis_id=latest.id)\
            .order_by(DiseaseProbability.probability.desc()).first()
        latest_info = {
            'id': latest.id,
            'diagnosis_no': latest.diagnosis_no,
            'created_at': latest.created_at.strftime('%Y-%m-%d %H:%M') if latest.created_at else None,
            'report_status': latest.report_status,
            'top_disease': top_prob.disease_name_zh if top_prob else None,
            'top_probability': round(top_prob.probability, 3) if top_prob else None,
        }

    return jsonify({
        'code': 200,
        'data': {
            'patient': patient.to_dict(),
            'stats': {
                'total_diagnoses': total_diagnoses,
                'pending_reports': pending_reports,
                'reviewed_reports': reviewed_reports,
                'triage_count': triage_count,
            },
            'latest_diagnosis': latest_info,
        }
    })


@patient_portal_bp.route('/diagnoses', methods=['GET'])
@token_required
def patient_diagnoses():
    """患者诊断记录列表"""
    patient_id = request.current_user_id
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)

    query = Diagnosis.query.filter_by(patient_id=patient_id)
    pagination = query.order_by(Diagnosis.created_at.desc())\
        .paginate(page=page, per_page=per_page, error_out=False)

    items = []
    for d in pagination.items:
        probs = DiseaseProbability.query.filter_by(diagnosis_id=d.id)\
            .order_by(DiseaseProbability.probability.desc()).limit(5).all()
        report = Report.query.filter_by(diagnosis_id=d.id)\
            .order_by(Report.version_no.desc()).first()

        items.append({
            **d.to_dict(),
            'top_diseases': [p.to_dict() for p in probs],
            'has_report': report is not None and bool(report.ai_generated_content),
            'report_status': d.report_status,
            'report_id': report.id if report else None,
        })

    return jsonify({
        'code': 200,
        'data': {
            'items': items,
            'total': pagination.total,
            'page': page,
            'per_page': per_page,
        }
    })


@patient_portal_bp.route('/reports', methods=['GET'])
@token_required
def patient_reports():
    """患者报告列表（仅已审核通过的）"""
    patient_id = request.current_user_id

    reports = db.session.query(Report).join(Diagnosis).filter(
        Diagnosis.patient_id == patient_id,
        Report.status.in_(['approved', 'reviewed', 'draft']),
        Report.ai_generated_content != ''
    ).order_by(Report.created_at.desc()).all()

    result = []
    for r in reports:
        diagnosis = Diagnosis.query.get(r.diagnosis_id)
        result.append({
            'id': r.id,
            'diagnosis_id': r.diagnosis_id,
            'diagnosis_no': diagnosis.diagnosis_no if diagnosis else '',
            'version_no': r.version_no,
            'findings': r.findings or '',
            'impression': r.impression or '',
            'recommendations': r.recommendations or '',
            'ai_generated_content': r.ai_generated_content or '',
            'status': r.status,
            'created_at': r.created_at.strftime('%Y-%m-%d %H:%M') if r.created_at else None,
            'model_used': r.ai_model_used or '',
        })

    return jsonify({'code': 200, 'data': result})


@patient_portal_bp.route('/report/<int:report_id>', methods=['GET'])
@token_required
def patient_report_detail(report_id):
    """查看单个报告详情（含完整内容）"""
    patient_id = request.current_user_id

    report = Report.query.get(report_id)
    if not report:
        return jsonify({'code': 404, 'message': '报告不存在'}), 404

    # 验证归属：该报告的诊断是否属于当前患者
    diagnosis = Diagnosis.query.get(report.diagnosis_id)
    if not diagnosis or diagnosis.patient_id != patient_id:
        return jsonify({'code': 403, 'message': '无权访问此报告'}), 403

    # 获取疾病概率
    probs = DiseaseProbability.query.filter_by(diagnosis_id=report.diagnosis_id)\
        .order_by(DiseaseProbability.probability.desc()).all()

    # 获取患者信息
    patient = Patient.query.get(diagnosis.patient_id)

    return jsonify({
        'code': 200,
        'data': {
            'report': {
                'id': report.id,
                'findings': report.findings or '',
                'impression': report.impression or '',
                'recommendations': report.recommendations or '',
                'ai_generated_content': report.ai_generated_content or '',
                'final_content': report.final_content or '',
                'doctor_edited_content': report.doctor_edited_content or '',
                'status': report.status,
                'created_at': report.created_at.strftime('%Y-%m-%d %H:%M') if report.created_at else None,
                'model_used': report.ai_model_used or '',
            },
            'diagnosis': {
                'id': diagnosis.id,
                'diagnosis_no': diagnosis.diagnosis_no,
                'image_path': diagnosis.image_path,
                'image_url': f'/static/images/{diagnosis.image_path.split("/")[-1]}' if diagnosis.image_path else '',
                'heatmap_path': diagnosis.heatmap_path,
                'heatmap_url': f'/static/heatmaps/{diagnosis.heatmap_path.split("/")[-1]}' if diagnosis.heatmap_path else '',
                'created_at': diagnosis.created_at.strftime('%Y-%m-%d %H:%M') if diagnosis.created_at else None,
                'patient_id': diagnosis.patient_id,
                'patient_name': patient.name if patient else '-',
                'patient_gender': patient.gender if patient else '-',
                'patient_age': patient.age if patient else None,
                'patient_no': patient.patient_no if patient else '-',
                'patient': patient.to_dict() if patient else None,  # 完整患者信息（包含 face_image_path）
            },
            'probabilities': [p.to_dict() for p in probs],
        }
    })


@patient_portal_bp.route('/triage-records', methods=['GET'])
@token_required
def patient_triages():
    """患者分诊记录"""
    patient_id = request.current_user_id

    records = TriageRecord.query.filter_by(patient_id=patient_id)\
        .order_by(TriageRecord.created_at.desc()).all()

    return jsonify({
        'code': 200,
        'data': [
            {
                **r.to_dict(),
                'created_at': r.created_at.strftime('%Y-%m-%d %H:%M') if r.created_at else None,
            }
            for r in records
        ]
    })
