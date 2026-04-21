---
name: aix-ray-diagnosis-system
description: 胸影智诊V3.0全栈AI辅助胸部X光影像诊断系统开发指南。基于Vue 3 + Flask + DenseNet-121 + ONNX Runtime + LLM的医学影像平台。包含业务端(诊断中心、批量诊断、智能分诊、AI咨询)和管理端(用户管理、权重管理、LLM配置)共14个功能模块。使用当处理此项目的代码修改、功能开发、问题排查或需要了解系统架构时。
---

# 胸影智诊 V3.0 开发指南

## 项目概述

胸影智诊 V3.0 是面向医疗机构的全栈 AI 辅助胸部 X 光影像诊断平台,基于 **DenseNet-121 (CheXNet)** 深度学习模型,支持 **14 种胸部疾病** 多标签概率预测,结合大语言模型自动生成专业放射学诊断报告。

### 核心技术栈

**前端:**
- Vue 3.5 + TypeScript 6.0 + Composition API
- Vite 8.0 构建工具
- Element Plus 2.13 UI 组件库
- Pinia 3.0 状态管理
- ECharts 6.0 数据可视化
- Axios 1.15 HTTP 客户端

**后端:**
- Flask 3.0 Python Web 框架
- SQLite 数据库 (WAL 模式优化)
- ONNX Runtime 推理加速 (2-5x)
- PyTorch Grad-CAM 热力图生成
- JWT 认证 + RBAC 权限控制
- AES-256 加密存储敏感信息

### 支持的 14 种胸部疾病

`Pneumonia`(肺炎)、`Atelectasis`(肺不张)、`Consolidation`(实变)、`Infiltration`(浸润)、`Mass`(肿块)、`Nodule`(结节)、`Effusion`(胸腔积液)、`Emphysema`(肺气肿)、`Fibrosis`(纤维化)、`Cardiomegaly`(心脏肥大)、`Edema`(水肿)、`Pneumothorax`(气胸)、`Hernia`(疝)、`Pleural_Thickening`(胸膜增厚)

## 项目结构

```
AIX-RayIntelligentDiagnosisSystemV3.0/
├── backend/                    # Flask 后端
│   ├── api/                   # 15个API Blueprint
│   │   ├── auth.py           # 认证接口
│   │   ├── diagnose.py       # 诊断接口
│   │   ├── batch.py          # 批量诊断
│   │   ├── triage.py         # 智能分诊
│   │   ├── chat.py           # AI咨询
│   │   ├── reports.py        # 报告管理
│   │   ├── approvals.py      # 诊断审批
│   │   ├── users.py          # 用户管理
│   │   ├── patients.py       # 患者管理
│   │   ├── model_weights.py  # 权重文件管理
│   │   ├── llm_configs.py    # LLM配置管理
│   │   ├── audit.py          # 审计日志
│   │   ├── settings.py       # 系统设置
│   │   └── dashboard.py      # 数据看板
│   ├── models/               # ORM模型定义
│   ├── services/             # 业务服务层
│   │   ├── ai_service.py     # AI推理服务(ONNX+PyTorch)
│   │   ├── llm_service.py    # LLM报告生成服务
│   │   ├── report_service.py # PDF报告导出
│   │   └── pdf_service.py    # PDF处理工具
│   ├── utils/                # 工具函数
│   │   ├── auth.py           # JWT Token生成验证
│   │   ├── encryption.py     # AES加密解密
│   │   └── validators.py     # 数据验证
│   ├── weights/              # AI模型权重文件
│   ├── uploads/              # 上传文件存储
│   │   ├── images/           # X光影像
│   │   └── heatmaps/         # Grad-CAM热力图
│   ├── app.py                # Flask应用入口
│   ├── config.py             # 配置文件
│   └── extensions.py         # 扩展初始化
│
├── frontend/                  # Vue 3 前端
│   ├── src/
│   │   ├── api/              # API接口封装(17个模块)
│   │   ├── views/            # 页面组件
│   │   │   ├── business/     # 业务端页面
│   │   │   │   ├── Dashboard.vue        # 数据看板
│   │   │   │   ├── Diagnosis.vue        # 诊断中心
│   │   │   │   ├── BatchDiagnosis.vue   # 批量诊断
│   │   │   │   ├── Triage.vue           # 智能分诊
│   │   │   │   ├── Chat.vue             # AI咨询
│   │   │   │   ├── History.vue          # 诊断历史
│   │   │   │   └── Approvals.vue        # 诊断审批
│   │   │   ├── admin/        # 管理端页面
│   │   │   │   ├── Overview.vue         # 系统概览
│   │   │   │   ├── Users.vue            # 用户管理
│   │   │   │   ├── Patients.vue         # 患者管理
│   │   │   │   ├── Weights.vue          # 权重管理
│   │   │   │   ├── LlmConfigs.vue       # LLM配置
│   │   │   │   ├── Audit.vue            # 审计日志
│   │   │   │   └── Settings.vue         # 系统设置
│   │   │   └── Login.vue     # 登录页面
│   │   ├── layouts/          # 布局组件
│   │   │   ├── MainLayout.vue    # 业务端布局
│   │   │   └── AdminLayout.vue   # 管理端布局
│   │   ├── stores/           # Pinia状态管理
│   │   ├── router/           # 路由配置
│   │   └── styles/           # 全局样式(CSS变量主题)
│   └── vite.config.ts        # Vite配置
│
├── batch_sample_images/      # 批量诊断示例图片
├── ProjectImage/             # 项目截图
└── .env                      # 环境变量配置
```

## 核心功能模块

### 业务端 (7大模块)

#### 1. 诊断中心 (Diagnosis)
- 拖拽上传 X 光影像 (PNG/JPG/JPEG)
- **智能文件名解析**: `P编号-姓名-性别-年龄-症状-序号.png`
- AI 实时推理: 14种疾病概率排序
- Grad-CAM 热力图叠加显示
- LLM 一键生成专业报告 (CRISPE提示框架)
- PDF 报告导出下载

**关键文件:**
- 前端: `frontend/src/views/business/Diagnosis.vue`
- 后端: `backend/api/diagnose.py`, `backend/services/ai_service.py`

#### 2. 批量诊断 (Batch Diagnosis)
- 多张影像并行处理
- ThreadPoolExecutor 4线程预处理 + ONNX批量推理
- 实时进度条反馈
- 支持中途取消任务
- 继续添加图片功能

**关键文件:**
- 前端: `frontend/src/views/business/BatchDiagnosis.vue`
- 后端: `backend/api/batch.py`

#### 3. 智能分诊 (Triage)
- 15+种常见症状多选
- 4级严重程度分级
- 5项生命体征录入
- AI分诊评估: 推荐科室 + 紧急程度判定

**关键文件:**
- 前端: `frontend/src/views/business/Triage.vue`
- 后端: `backend/api/triage.py`

#### 4. AI医学咨询 (Chat)
- SSE流式对话 (实时打字效果)
- 5种医生角色切换: 放射科/呼吸科/胸外科/急诊科/全科
- 会话管理: 新建/切换/删除
- Markdown格式渲染
- 保留最近10轮对话上下文

**关键文件:**
- 前端: `frontend/src/views/business/Chat.vue`
- 后端: `backend/api/chat.py`, `backend/services/llm_service.py`

#### 5. 数据看板 (Dashboard)
- 诊断统计趋势 (今日/本周/本月/总计)
- 疾病分布图表 (ECharts饼图+柱状图)
- 用户活跃度统计
- 待审批数量Badge提醒
- AI模型运行状态监控

**关键文件:**
- 前端: `frontend/src/views/business/Dashboard.vue`
- 后端: `backend/api/dashboard.py`

#### 6. 诊断历史 (History)
- 诊断记录列表 (分页+筛选)
- 详情查看: 检测结果+热力图+报告全文
- PDF在线预览/下载

#### 7. 诊断审批 (Approvals)
- 三态列表: 待审批/已审批/已驳回
- 审核操作: 通过/驳回 (含备注)
- 审批状态流转追踪

### 管理端 (7大模块)

#### 1. 系统概览
- 运行数据大盘
- 用户/患者/诊断统计
- 模型状态监控

#### 2. 用户管理
- CRUD操作
- 角色分配: admin/doctor/nurse
- 启用/禁用账户
- 密码重置

#### 3. 患者管理
- CRUD操作
- 既往史/过敏史记录
- 关联诊断记录查看

#### 4. 权重文件管理
- 上传模型权重 (.pth/.pt/.onnx)
- 列表管理
- **在线切换激活权重**

**关键文件:**
- 后端: `backend/api/model_weights.py`

#### 5. 大模型API管理
- 多LLM配置管理
- **AES加密存储** API Key
- OpenAI兼容接口
- 测试连接功能
- 优先级设置

**关键文件:**
- 后端: `backend/api/llm_configs.py`, `backend/utils/encryption.py`

#### 6. 审计日志
- 29+操作类型中文标签
- 筛选: 类型/时间/IP
- 操作人/详情完整记录
- 自动清理机制

**关键文件:**
- 后端: `backend/api/audit.py`

#### 7. 系统设置
- 系统名称配置
- 检测阈值调整
- 上传大小限制
- 会话超时时间
- 日志保留天数
- 并发数设置

## 技术要点

### AI推理引擎 (双引擎架构)

**ONNX Runtime (优先):**
- 推理速度比PyTorch快2-5倍
- 支持CPU/GPU/CUDA/DirectML自动检测
- 批量推理优化

**PyTorch (回退):**
- 用于Grad-CAM热力图生成
- 懒加载机制 (按需加载,节省显存)

**关键代码位置:**
```python
# backend/services/ai_service.py
class AIService:
    def __init__(self):
        self.onnx_session = self._load_onnx_model()  # ONNX推理
        self.pytorch_model = None  # 懒加载PyTorch模型
    
    def predict(self, image_path):
        # 优先使用ONNX推理
        pass
    
    def generate_heatmap(self, image_path):
        # 按需加载PyTorch生成热力图
        if not self.pytorch_model:
            self.pytorch_model = self._load_pytorch_model()
        pass
```

### 智能文件名解析

```python
# 格式: P编号-姓名-性别-年龄-症状-序号.png
# 示例: P20260315001-张伟-male-45-Cough-001.png

def parse_filename(filename):
    parts = filename.replace('.png', '').split('-')
    return {
        'patient_id': parts[0],    # P20260315001
        'name': parts[1],          # 张伟
        'gender': parts[2],        # male
        'age': int(parts[3]),      # 45
        'symptom': parts[4],       # Cough
        'sequence': parts[5]       # 001
    }
```

### LLM报告生成 (CRISPE提示框架)

```python
# backend/services/llm_service.py
CRISPE_PROMPT_TEMPLATE = """
Capacity: 你是一位经验丰富的放射科专家
Role: 根据AI检测结果和影像特征生成专业诊断报告
Insight: 患者{age}岁{gender},症状:{symptoms}
Statement: 检测到以下疾病概率:{probabilities}
Personality: 使用专业医学术语,简洁清晰
Experiment: 输出格式包含:检查所见、诊断意见、建议
"""
```

### JWT认证 + RBAC权限

```python
# backend/utils/auth.py
def generate_token(user_id, role):
    payload = {
        'user_id': user_id,
        'role': role,  # admin/doctor/nurse
        'exp': datetime.utcnow() + timedelta(days=30)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

# 路由权限装饰器
def require_role(role):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            token = request.headers.get('Authorization')
            user = verify_token(token)
            if user['role'] != role:
                abort(403)
            return f(*args, **kwargs)
        return decorated
    return decorator
```

### AES-256加密存储

```python
# backend/utils/encryption.py
from Crypto.Cipher import AES
import base64

def encrypt_api_key(key):
    cipher = AES.new(ENCRYPTION_KEY, AES.MODE_GCM)
    ciphertext, tag = cipher.encrypt_and_digest(key.encode())
    return base64.b64encode(cipher.nonce + tag + ciphertext).decode()

def decrypt_api_key(encrypted_key):
    data = base64.b64decode(encrypted_key)
    nonce, tag, ciphertext = data[:16], data[16:32], data[32:]
    cipher = AES.new(ENCRYPTION_KEY, AES.MODE_GCM, nonce=nonce)
    return cipher.decrypt_and_verify(ciphertext, tag).decode()
```

### 数据库优化 (SQLite WAL模式)

```python
# backend/extensions.py
def init_db(app):
    db.init_app(app)
    with app.app_context():
        db.create_all()
        # 启用WAL模式减少锁竞争
        db.session.execute(text("PRAGMA journal_mode=WAL"))
        db.session.execute(text("PRAGMA busy_timeout=5000"))
```

### SSE流式对话

```python
# backend/api/chat.py
from flask import Response, stream_with_context

@app.route('/api/chat/stream', methods=['POST'])
def chat_stream():
    def generate():
        for chunk in llm_service.stream_chat(messages):
            yield f"data: {json.dumps(chunk)}\n\n"
    
    return Response(
        stream_with_context(generate()),
        mimetype='text/event-stream'
    )
```

## 开发工作流

### 启动后端

```bash
cd backend
pip install -r requirements.txt
python app.py
# 服务运行在 http://localhost:5000
```

### 启动前端

```bash
cd frontend
npm install
npm run dev
# 服务运行在 http://localhost:5173
```

### 数据库初始化

```bash
cd backend
python init_db.py
# 创建默认管理员账户
```

### 模型权重转换 (PyTorch → ONNX)

```bash
cd backend
python scripts/convert_to_onnx.py --input model.pth --output model.onnx
```

## 常见问题排查

### 1. ONNX推理失败

**症状:** `ONNX Runtime error: Invalid graph`

**解决:**
```bash
# 检查ONNX模型是否损坏
python -c "import onnx; onnx.checker.check_model('model.onnx')"

# 重新转换模型
python scripts/convert_to_onnx.py
```

### 2. 数据库锁定错误

**症状:** `sqlite3.OperationalError: database is locked`

**解决:**
```python
# 已在extensions.py中配置WAL模式和busy_timeout
# 如仍出现,检查是否有未关闭的数据库连接
db.session.remove()
```

### 3. Grad-CAM热力图生成慢

**原因:** PyTorch模型首次加载耗时

**解决:** 已实现懒加载机制,首次生成后模型常驻内存

### 4. LLM API调用失败

**检查:**
```bash
# 验证API Key是否正确解密
python -c "from utils.encryption import decrypt_api_key; print(decrypt_api_key('encrypted_key'))"

# 测试LLM连接
curl -X POST http://localhost:5000/api/llm-configs/test -H "Authorization: Bearer TOKEN"
```

### 5. 前端CORS错误

**解决:** 检查 `backend/config.py` 中的 `CORS_ORIGINS` 配置

```python
CORS_ORIGINS = ["http://localhost:5173", "http://localhost:3000"]
```

## 性能优化建议

### 前端优化
- 使用 `<script setup>` 语法糖减少样板代码
- 组件懒加载: `const Diagnosis = () => import('./views/Diagnosis.vue')`
- 图片懒加载: `v-lazy` 指令
- ECharts按需引入

### 后端优化
- ONNX批量推理 (已实现)
- 数据库连接池 (SQLAlchemy内置)
- 缓存热点数据 (Redis可选)
- 异步任务队列 (Celery可选,用于批量诊断)

### 部署优化
- Nginx反向代理 + Gunicorn多进程
- 静态资源CDN加速
- 数据库定期备份
- 日志轮转清理

## 安全注意事项

1. **生产环境必须修改:**
   - `SECRET_KEY` (JWT签名密钥)
   - `ENCRYPTION_KEY` (AES加密密钥)
   - 默认管理员密码

2. **敏感信息保护:**
   - API Key使用AES-256加密存储
   - 患者数据脱敏展示
   - 审计日志记录所有敏感操作

3. **访问控制:**
   - 管理端仅admin角色可访问
   - 诊断审批需doctor及以上角色
   - IP白名单可选配置

4. **文件上传安全:**
   - 限制文件大小 (默认10MB)
   - 验证文件类型 (仅PNG/JPG/JPEG)
   - 随机文件名防止路径遍历攻击

## 扩展开发指南

### 添加新的API接口

```python
# backend/api/new_feature.py
from flask import Blueprint, request, jsonify
from utils.auth import token_required

bp = Blueprint('new_feature', __name__, url_prefix='/api/new-feature')

@bp.route('/endpoint', methods=['POST'])
@token_required
def create_resource(current_user):
    data = request.get_json()
    # 业务逻辑
    return jsonify({'message': 'Success'}), 201
```

注册Blueprint:
```python
# backend/app.py
from api.new_feature import bp as new_feature_bp
app.register_blueprint(new_feature_bp)
```

### 添加新的Vue页面

```vue
<!-- frontend/src/views/NewPage.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useNewFeatureApi } from '@/api/newFeature'

const data = ref([])
const api = useNewFeatureApi()

onMounted(async () => {
  data.value = await api.getList()
})
</script>

<template>
  <div class="new-page">
    <!-- 页面内容 -->
  </div>
</template>
```

添加路由:
```typescript
// frontend/src/router/index.ts
{
  path: '/new-page',
  name: 'NewPage',
  component: () => import('@/views/NewPage.vue'),
  meta: { requiresAuth: true, role: 'admin' }
}
```

### 自定义AI模型

1. 训练新模型 (PyTorch)
2. 转换为ONNX格式
3. 上传到 `backend/weights/`
4. 通过管理端切换激活

```python
# 确保新模型输出格式兼容
# 输出: 14维概率向量,对应14种疾病
```

## 相关文档

- **详细API文档**: 见项目根目录 README.md 的 "API 接口文档" 章节
- **数据库设计**: 见 README.md 的 "数据库设计" 章节
- **部署指南**: 见 README.md 的 "部署指南" 章节
- **配置说明**: 见 `.env` 文件和 `backend/config.py`

## 快速参考

### 默认账号
- 管理员: `admin` / `admin123`
- 医生: `doctor` / `doctor123`
- 护士: `nurse` / `nurse123`

### 关键端口
- 后端API: `http://localhost:5000`
- 前端开发: `http://localhost:5173`

### 重要目录
- 模型权重: `backend/weights/`
- 上传文件: `backend/uploads/`
- 数据库: `backend/data/aixray.db`
- 示例图片: `batch_sample_images/`

### 常用命令
```bash
# 后端
cd backend && python app.py

# 前端
cd frontend && npm run dev

# 数据库初始化
cd backend && python init_db.py

# 模型转换
cd backend && python scripts/convert_to_onnx.py
```

---

**注意:** 本技能文件为精简版,详细信息请参考项目根目录的完整 README.md 文档。
