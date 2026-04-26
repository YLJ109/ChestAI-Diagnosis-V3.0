# 患者门户模块说明

## 📁 目录结构

```
patient/
├── MainPage.vue          # 患者门户主页面（导航栏 + 模块切换）
├── ReportListPage.vue    # 诊断报告列表页面
├── HistoryPage.vue       # 就诊历史页面
├── TriagePage.vue        # 智能分诊页面（引用医护版）
└── ChatPage.vue          # AI咨询页面（引用医护版）
```

## 🎯 组件职责

### 1. MainPage.vue - 主框架页面
**职责**：
- 顶部导航栏（品牌Logo、统计数据、用户信息、退出登录）
- 首页视图（欢迎信息 + 四大功能模块入口卡片）
- 模块路由切换（home/report/history/triage/chat）
- 底部状态栏
- 全局样式定义（医疗级自助终端风格）

**特点**：
- 采用医疗级一体机终端设计风格
- 大按钮、清晰的颜色编码
- 渐变背景、圆角卡片、阴影效果
- 固定浅色主题（日间模式）

### 2. ReportListPage.vue - 诊断报告列表
**职责**：
- 显示患者的所有诊断报告
- 报告列表展示（编号、状态、时间、模型、预览）
- 报告详情弹窗（AI发现、诊断印象、医疗建议、疾病概率）
- 报告打印功能

**交互**：
- 点击报告项查看详情
- 支持直接打印报告
- 返回主页按钮

### 3. HistoryPage.vue - 就诊历史
**职责**：
- 时间线形式展示所有就诊记录
- 显示每次检测的TOP疾病及概率
- 报告状态标签（待审核/已审核/已批准/已拒绝）
- 快速查看和打印功能

**设计**：
- 渐变时间线轴线
- 最新记录脉冲动画
- 彩色概率标签
- 悬停右移效果

### 4. TriagePage.vue - 智能分诊
**职责**：
- 引用医护版的TriagePage组件
- 保持与医护端完全一致的功能和界面

**实现**：
```vue
<template>
  <TriagePage />
</template>
<script setup lang="ts">
import TriagePage from '../triage/TriagePage.vue'
</script>
```

### 5. ChatPage.vue - AI健康咨询
**职责**：
- 引用医护版的ChatPage组件
- 保持与医护端完全一致的功能和界面

**实现**：
```vue
<template>
  <ChatPage />
</template>
<script setup lang="ts">
import ChatPage from '../chat/ChatPage.vue'
</script>
```

## 🎨 设计风格

### 医疗级自助终端特色
1. **大按钮设计** - 适合触摸屏操作
2. **颜色编码系统**：
   - 🔵 蓝色：诊断报告
   - 🟣 紫色：就诊历史
   - 🟠 橙色：智能分诊
   - 🟢 绿色：AI咨询

3. **视觉反馈**：
   - 悬停上浮 + 放大 + 阴影加深
   - 点击轻微缩小
   - 徽章脉冲动画

4. **专业医疗感**：
   - 蓝绿色系主题色
   - 圆角卡片（16-20px）
   - 渐变装饰条
   - 等宽字体显示编号

## 🔄 模块切换流程

```
MainPage (首页)
  ├─→ ReportListPage (诊断报告)
  ├─→ HistoryPage (就诊历史)
  ├─→ TriagePage (智能分诊)
  └─→ ChatPage (AI咨询)
```

每个子页面通过 `$emit('back')` 事件通知父组件返回首页。

## 📝 使用说明

### 路由配置
在 `router/index.ts` 中：
```typescript
{
  path: '/patient',
  name: 'PatientPortal',
  component: () => import('@/views/patient/MainPage.vue'),
  meta: { title: '患者门户', role: 'patient' },
}
```

### 访问方式
患者登录后自动跳转到 `/patient`，进入MainPage首页。

## ✨ 优势

1. **代码分离** - 每个功能独立文件，便于维护
2. **组件复用** - 分诊和咨询直接复用医护版
3. **职责清晰** - 主页面负责导航，子页面负责业务
4. **易于扩展** - 新增模块只需添加新组件
5. **统一风格** - 医疗级终端设计贯穿始终

## 🔧 后续优化建议

1. 可以为每个子页面添加独立的loading状态
2. 考虑添加面包屑导航
3. 可以提取公共的工具函数到utils文件
4. 可以添加页面级别的错误边界处理
