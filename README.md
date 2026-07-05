# Arya's Diary

情绪记录与自我关怀工具。记录、理解、成长。

**🔒 所有数据纯本地存储，保护隐私。**

## 功能

- 🏠 **首页** — 223条名人语录随机展示，点赞/点灭
- 📝 **记录** — 你问我答（心情优先引导）、随记（图片+标签）、梦境记录（离线解析）
- 📒 **笔记** — 月度/心情/类型芯片筛选，卡片式时间线
- 🔧 **管理** — 主题配色、深色模式、WHO AM I、击登闻鼓反馈

## 技术栈

- 原生 JavaScript (ES Modules)
- IndexedDB 本地存储
- PWA (Service Worker + Web App Manifest)
- GitHub Pages 托管
- GitHub Issues 反馈系统

## 文件结构

```
diary-app/
├── index.html              # 入口 SPA
├── admin.html              # 管理后台
├── manifest.json           # PWA 配置
├── sw.js                   # Service Worker
├── version.json            # 版本检测
├── css/
│   └── style.css           # 全局样式
├── js/
│   ├── app.js              # 路由、导航、初始化
│   ├── db.js               # IndexedDB 数据层
│   ├── guided-entry.js     # 你问我答（心情优先引导）
│   ├── free-entry.js       # 随记（图片+标签）
│   ├── notes.js            # 情绪笔记（卡片+筛选）
│   ├── manage.js           # 管理（统计+主题+反馈）
│   ├── dream-entry.js      # 梦境记录
│   ├── dream-symbols.js    # 梦境象征词典
│   ├── github-feedback.js  # GitHub Issues 反馈
│   ├── quotes.js           # 223条语录库
│   ├── user.js             # 用户昵称管理
│   └── utils.js            # 工具函数+标签定义
├── data/
│   └── feedbacks.json      # 反馈数据
└── assets/icons/           # PWA 图标
```

## 外部依赖

| 服务 | 用途 | 费用 |
|---|---|---|
| GitHub Pages | 托管 | 免费 |
| GitHub API | 反馈→Issue | 免费 |
| GitHub Raw | 后台读反馈 | 免费 |
| unpkg CDN | Lucide图标 | 免费 |
