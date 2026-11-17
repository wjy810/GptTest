# FOLIO：独立编辑杂志复刻指南

一个以阅读、收藏和留白为核心的完整网站。首屏为梅紫封面与建筑插画，接着是四篇文章、编辑宣言与来信表单。它有独立 HTML、React 入口和样式，可单独部署，不需要目录站包裹。

## 运行与文件入口

所有命令在仓库根目录执行；Node.js 24 为本项目已验证环境。

```bash
cd /workspace/GptTest
npm ci
npm run dev -- --mode editorial
```

默认开发端口为 `5174`。若冲突，添加 `--port 5274`。

```bash
npm run typecheck
npm run build -- --mode editorial
npm run preview
```

构建产物为 `dist/editorial/`；根预览服务访问 `/editorial/`。`typecheck` 检查整个仓库，不只是本套站点。

- [index.html](index.html)：文档语言、标题、根容器、入口脚本。
- [src/main.tsx](src/main.tsx)：`stories` 数据、`Artwork`、`Starburst`、`keepReaderFocus`、`App`。
- [src/styles.css](src/styles.css)：所有站内布局、字体、响应式与减少动态效果规则。
- [第一批反刍](../../docs/reviews/BATCH-01.md)：本套的真实修复过程、截图与验证记录。

## 视觉参数：先复制角色，再调整数值

| 角色 | 当前源码值 | 位置 |
| --- | --- | --- |
| 纸张背景 | `#f1eee5` | `:root`、`.reader` |
| 正文暖黑 | `#342e32` | `:root` |
| 封面梅紫 | `#322b38` | `.hero-copy` |
| 封面浅字 | `#f5eee4` | `.hero-copy` |
| 铜粉强调 | `#dfbaa8` | `.hero h1 span`、`.hero-english em` |
| 最大版心 | `1600px` | `main,header,footer,.mast-meta` |
| 封面布局 | `1fr 1fr`，左右外边距 `4%` | `.hero` |
| 主标题 | `clamp(44px,4.4vw,74px)`，行高 `1.35` | `.hero h1` |
| 英文标题 | Georgia，`51px`，行高 `1.05` | `.hero-english` |
| 文章列表 | 四列，间隔 `25px` | `.story-grid` |

本套没有外部字体请求。中文按宋体/可用 CJK 衬线字体回退，英文使用 Georgia；不同操作系统字形会有差异。先保留行长和层级，再决定是否引入自托管字体。

## 页面骨架与复刻顺序

1. 写 `mast-meta`、`folio-header` 和双栏 `.hero`；让文案区和图像区共享完整矩形边界。
2. 放入 `.issue-strip`，用一条轻横线把封面和正文区分开。
3. 用 `stories` 数组生成 `.story-grid`；图片、分类、标题、摘要、阅读时间按相同顺序排布。
4. 增加 `.manifesto`：左侧编号与星芒，右侧大字观点和短解释；它不是第二套商品卡片。
5. 最后补 `.letter`、页脚和独立的 `.reader` 弹窗，再实现状态。

桌面封面最低高度 `620px`；1000px 以下文章变两列；600px 以下封面上下堆叠、文案区至少 `520px`、插画区 `410px`。手机仍保留两列文章，摘要 `12px`，收藏按钮命中区至少 `44×44px`。

## SVG 构图：不用截图背景也能还原气氛

`Artwork` 以 `600×640` 为设计坐标。先画墙面和地面的透视多边形，再画拱门、山形远景、光束、树和花盆；`clay` 分支改为陶壶与桌面，`olive` 分支改为茶桌。`blue` 分支给同一建筑骨架换蓝灰墙色。

```tsx
<svg viewBox="0 0 600 640" preserveAspectRatio="xMidYMid slice">
  {/* 墙面 → 地面 → 拱门 → 光束 → 植物 */}
</svg>
```

`slice` 允许适度裁切，保证不同长宽比容器铺满；不要只给 SVG 设置 `object-fit` 后假定会像照片一样覆盖。
每个实例的渐变 ID 由 `useId()` 生成，避免首屏、文章卡片、阅读窗重用时冲突。
最上层使用 `#fff4df`、`opacity=.025` 的暖色薄层；噪声滤镜定义仍在代码中，但没有挂到可见图层。
`Starburst` 在 `100×100` 坐标中旋转八根矩形，每次转 `22.5°`，使用 `currentColor`，不依赖系统 emoji 字形。

## 状态与源码定位

| 状态/函数 | 用户行为 | 复刻时必须保留 |
| --- | --- | --- |
| `category` | 全部/空间/物件/日常/已收藏切换 | 过滤真实数组；按钮 `aria-pressed` 同步 |
| `article` + `dialog` | 点击封面、图片或标题阅读 | 原生 `showModal()`、具名标题、关闭与焦点返回 |
| `saved` + `bookmark(id)` | 收藏、取消收藏 | `folio-saved` 中只接受有效 ID 数组并去重 |
| `keepReaderFocus` | 阅读窗内 Tab/Shift+Tab | 首末控件循环；Escape 使用原生 dialog 行为 |
| `email` / `subscribed` | 输入邮箱并提交 | HTML 邮箱校验、明确本地反馈、编辑后重置反馈 |

打开阅读窗时锁定背景滚动，关闭后恢复之前的 `overflow`。遮罩点击先判断坐标是否真的在弹窗边界外，避免点正文留白就关窗。
订阅意向写入 `folio-newsletter-demo`；它不会发邮件，也没有账户、CMS 或真实订阅服务。

## 五步验收

1. 在 1440px 和 390px 查看整页：封面插画无竖向留边、无横向滚动；梅紫与铜粉颜色一致，星芒不是彩色 emoji。
2. 用键盘聚焦“阅读本期封面故事”，Enter 打开；Tab 在窗口内循环；Escape 关闭后焦点回到原按钮。
3. 收藏一篇、刷新、打开“已收藏”：仅显示该篇；取消最后一篇后出现空状态。空间分类应显示两篇。
4. 在临时测试浏览器把 `folio-saved` 写为 `{}` 或混合重复数组，刷新仍正常；不要在需要保留收藏的个人浏览器做破坏性测试。
5. 输入合法邮箱后显示本地保存反馈；开启减少动态效果偏好后不平滑滚动，文章和导航仍可用。

第一批实际通过记录可运行 `node artifacts/reviews/verify-batch01.mjs` 重查；需先构建相关站点并启动根预览服务。该脚本需要本环境的 `/usr/bin/chromium`。

## 单独部署与扩展

把 `dist/editorial/` **目录内容**上传到一个静态站根目录即可。构建 `base` 是 `./`，所以也可置于静态子目录；保留 `index.html` 与 `assets/` 的相对位置。没有客户端路由，页面内导航使用锚点，不需要 SPA 路由重写。

若拆成独立仓库，复制本目录，再配置自己的 `package.json`、Vite React 插件及 TypeScript；当前本目录共用仓库根依赖，直接移走源码目录并不会自动带走构建工具。
替换文章数据时，保持稳定且唯一的 `id`，否则旧收藏会失效。正式内容需接入真实文章正文与订阅 API。

## 研究依据与边界

- [Radix Dialog 文档](https://github.com/radix-ui/website/blob/main/data/primitives/docs/components/dialog.mdx)：标题、焦点约束、Esc、触发器焦点返回；本套用原生 dialog 实现，没有安装 Radix。
- [Codrops 排版示例源码](https://github.com/codrops/OnScrollTypographyAnimations)：文字作为主要构图元素的研究入口；本套未移植其 GSAP 动画。
- [Material 令牌文档](https://github.com/material-components/material-web/blob/main/docs/theming/README.md)：基础色值与语义角色的组织方法。
- 阅读范围与访问限制见 [SOURCES.md](../../docs/SOURCES.md)。人物、文字、插画是原创演示内容；本套是风格研究，不是未经观察的外站逐像素复制。
