# 情绪日记

帮助焦虑症/抑郁症患者家属记录情绪与应对策略的工具。通过系统化的记录，更好地理解病症、找到有效的应对方法。

**🔒 所有数据纯本地存储，保护隐私。**

## 功能

- **📋 引导记录** — 5 步向导：触发事件 → 患者反应 → 你的情绪 → 应对策略 → 效果评分
- **✍️ 自由书写** — 随心记录，支持情绪和策略标签
- **📋 历史回顾** — 按时间线浏览、按情绪/策略筛选、关键词搜索
- **📚 知识库** — 焦虑症/抑郁症科普、家属自我照顾、沟通技巧、危机资源

## 使用方式

### 本地运行

```bash
cd diary-app
python3 -m http.server 8080
# 浏览器打开 http://localhost:8080
```

### 添加到手机主屏幕（PWA）

1. 在手机浏览器打开地址
2. Safari: 点击分享按钮 → "添加到主屏幕"
3. Chrome: 菜单 → "添加到主屏幕"

## 技术栈

- 原生 JavaScript (ES Modules)
- IndexedDB 本地存储
- PWA (Service Worker + Web App Manifest)
- 零依赖，纯前端

## 文件结构

```
diary-app/
├── index.html          # 入口 SPA
├── manifest.json       # PWA 配置
├── sw.js               # Service Worker（离线缓存）
├── css/
│   └── style.css       # 全局样式（移动优先）
├── js/
│   ├── app.js          # 路由、导航、初始化
│   ├── db.js           # IndexedDB 数据层
│   ├── guided-entry.js # 引导式记录（5步向导）
│   ├── free-entry.js   # 自由书写
│   ├── history.js      # 历史记录 + 筛选
│   ├── knowledge.js    # 知识库
│   └── utils.js        # 工具函数 + 标签定义
└── assets/icons/       # PWA 图标
```
