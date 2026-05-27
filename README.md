# Haclutch — Valorant 电竞数据面板

一个简洁、快速的 Valorant 电竞数据面板，使用原生 HTML、CSS 和 JavaScript 构建，无框架、无构建工具。

## 功能

### 页面

| 页面 | 说明 |
|------|------|
| **News** | VLR.GG 最新电竞资讯 |
| **Matches** | 比赛直播、即将开始、历史结果，支持系列/赛区筛选 |
| **Rankings** | 按地区查看战队排名 |
| **Stats** | 选手数据统计，支持地区、时间段、战队、英雄筛选 |
| **Players** | 选手列表，支持地区筛选 |
| **Teams** | 战队列表，支持地区筛选 |
| **Events** | 赛事浏览，支持状态切换和系列/赛区筛选 |

### 亮点

- **Hash SPA 路由** — `#/matches`、`#/team/123`、`#/player/456`
- **双 API 后端** — 合并两个 API 数据，覆盖更全面
- **智能缓存** — localStorage 按 key 设置 TTL，支持 stale-while-revalidate
- **暗色模式** — 自动跟随系统，VLR logo 随主题切换
- **响应式** — 适配桌面和移动端
- **懒加载头像** — Stats 页面使用 IntersectionObserver 按需加载选手头像
- **多列排序** — 点击表头可叠加排序条件
- **搜索** — 支持搜索战队、选手、赛事、系列

## 快速启动

```bash
# 启动本地开发服务器（含 CORS 代理）
python3 server.py

# 浏览器打开
open http://localhost:8080
```

端口被占用时：

```bash
lsof -ti:8080 | xargs kill -9
```

## 部署到 Vercel

项目以静态站部署到 Vercel，通过 `vercel.json` 代理 API 请求，无需服务器。

1. 推送到 GitHub
2. 在 [vercel.com](https://vercel.com) 导入仓库
3. 点击 **Deploy** — 无需额外配置

API 代理规则：

```
/v2/*     → https://v.kiringo.cn/v2/*     （数据、比赛、排名、赛事）
/api/v1/* → https://vlr.kiringo.cn/*       （VLR 选手、战队、赛事详情）
```

每次推送到 `main` 分支会自动重新部署。

## 项目结构

```
├── index.html          # 页面骨架：导航、搜索栏、#app 容器、弹窗
├── vercel.json         # Vercel 部署配置（API 代理）
├── server.py           # 本地开发服务器 + CORS 代理
├── assets/
│   ├── style.css       # Airbnb 风格设计系统
│   └── app.js          # 全部业务逻辑：路由、API、渲染、缓存
├── docs/
│   └── DESIGN.md       # 设计规范
├── api/
│   ├── v.json          # 主数据 API OpenAPI 文档
│   └── vlr.json        # VLR API OpenAPI 文档
├── CLAUDE.md           # Claude Code 项目指引
└── README.md           # 项目说明
```

### 路由

基于 Hash 的 SPA。`app.js` 中的路由读取 `location.hash`，分发到对应的 `render*()` 函数，直接写入 `#app`。

```
#/                  → 新闻
#/matches           → 比赛
#/rankings          → 排名
#/stats             → 选手数据
#/players           → 选手列表
#/teams             → 战队列表
#/events            → 赛事列表
#/team/:id          → 战队详情
#/player/:id        → 选手详情
#/event/:id         → 赛事详情
#/search?q=...      → 搜索结果
```

### API

两个后端，统一通过同源路径代理：

| 路径 | 后端 | 数据 |
|------|------|------|
| `/v2/*` | `v.kiringo.cn` | 数据统计、比赛、排名、赛事、搜索 |
| `/api/v1/*` | `vlr.kiringo.cn` | VLR 选手资料、战队数据、赛事详情 |

### 缓存

`app.js` 中的 `CacheManager` 使用 localStorage，按 key 设置 TTL：

| Key | TTL | 说明 |
|-----|-----|------|
| `/news` | 5 分钟 | |
| `/match` | 30 秒 | 直播比分刷新频繁 |
| `/match/details` | 5 分钟 | |
| `/rankings` | 5 分钟 | |
| `/stats` | 5 分钟 | |
| `/events` | 5 分钟 | |
| `/team` | 5 分钟 | |
| `/player` | 5 分钟 | |
| `/search` | 2 分钟 | |
| VLR API 路径 | 5 分钟 | 独立缓存命名空间 |

过期缓存会立即返回，同时在后台刷新（stale-while-revalidate）。

## 设计系统

Airbnb 风格设计，暖色调 Rausch 强调色。完整规范见 [DESIGN.md](DESIGN.md)。

### 核心变量

```css
/* 颜色 */
--primary: #ff385c       /* Rausch 粉 */
--ink: #222              /* 标题 */
--body: #3f3f3f          /* 正文 */
--muted: #6a6a6a         /* 次要文字 */
--canvas: #fff           /* 页面背景 */
--surface-soft: #f7f7f7  /* 卡片/头部背景 */

/* 圆角 */
--r-xs: 4px;  --r-sm: 8px;  --r-md: 14px
--r-lg: 20px; --r-xl: 32px; --r-full: 9999px

/* 间距 */
--s-xxs: 2px; --s-xs: 4px;  --s-sm: 8px
--s-md: 12px; --s-base: 16px; --s-lg: 24px
--s-xl: 32px; --s-xxl: 48px; --s-section: 64px

/* 字体 */
--font: 'Inter', -apple-system, system-ui, 'Helvetica Neue', sans-serif
```

### 暗色模式

通过 `@media(prefers-color-scheme: dark)` 自动切换，覆盖所有颜色变量。VLR API 请求会附加 `?theme=light|dark` 参数以获取对应主题的 logo。

## 关键模式

- **`$()` / `$$()`** — querySelector / querySelectorAll 快捷方法
- **`esc()`** — XSS 安全的 HTML 转义
- **`fixImg()`** — 协议相对 URL 处理（`//` → `https://`）
- **`flagToEmoji()`** — 国家代码转 Emoji 国旗
- **`vlrThemePath()`** — 为 VLR API 路径附加主题参数
- **`IntersectionObserver`** — Stats 页面选手头像懒加载
- **`safeFetch()`** — 空值安全的 fetch 封装

## 开发

```bash
# 启动开发服务器
python3 server.py

# 关闭已有服务器
lsof -ti:8080 | xargs kill -9
```

无需构建步骤，直接编辑 `index.html`、`style.css`、`app.js` 后刷新即可。

## 技术栈

- **HTML5** — 语义化标签
- **CSS3** — 自定义属性、Grid、Flexbox、`@media(prefers-color-scheme)`
- **原生 JavaScript** — ES2020+、async/await、IntersectionObserver
- **Python 3** — 本地开发服务器 + CORS 代理
- **Vercel** — 静态托管 + API 代理

## 开源协议

MIT
