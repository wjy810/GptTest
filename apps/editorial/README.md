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

| 角色     | 当前源码值                               | 位置                                |
| -------- | ---------------------------------------- | ----------------------------------- |
| 纸张背景 | `#f1eee5`                                | `:root`、`.reader`                  |
| 正文暖黑 | `#342e32`                                | `:root`                             |
| 封面梅紫 | `#322b38`                                | `.hero-copy`                        |
| 封面浅字 | `#f5eee4`                                | `.hero-copy`                        |
| 铜粉强调 | `#dfbaa8`                                | `.hero h1 span`、`.hero-english em` |
| 最大版心 | `1600px`                                 | `main,header,footer,.mast-meta`     |
| 封面布局 | `1.04fr 1fr`，左右外边距 `4%`            | `.hero`                             |
| 主标题   | `clamp(44px,4.6vw,74px)`，行高 `1.32`    | `.hero h1`                          |
| 英文标题 | Georgia，`48px`，行高 `1.05`             | `.hero-english`                     |
| 文章列表 | `1.2fr 1fr`，列间距 `46px`；主故事跨三行 | `.story-grid-curated`               |

本套没有外部字体请求。中文按宋体/可用 CJK 衬线字体回退，英文使用 Georgia；不同操作系统字形会有差异。先保留行长和层级，再决定是否引入自托管字体。

## 页面骨架与复刻顺序

1. 写 `mast-meta`、`folio-header` 和双栏 `.hero`；让文案区和图像区共享完整矩形边界。
2. 放入 `.issue-strip`，用一条轻横线把封面和正文区分开。
3. 用 `stories` 数组生成 `.story-grid`。全部分类时，第一篇加 `.story-lead` 跨三行，右侧三篇用 `155px` 插画搭配正文。分类结果用 `.story-grid-filtered` 两列平等展示，避免把任意筛选结果误当封面故事。
4. 增加 `.manifesto`：左侧编号与星芒，右侧大字观点和短解释；它不是第二套商品卡片。
5. 最后补 `.letter`、页脚和独立的 `.reader` 弹窗，再实现状态。

桌面封面最低高度 `600px`；1500px 以上提升到 `650px`。800px 以下文章全部分类改为单列，先读完整主故事，再读三个横向图文索引。600px 以下封面上下堆叠，文案高度由内容决定、插画 `300px`；360px 以下插画为 `270px`。手机主故事摘要 `14px`，其他索引摘要 `12px`；收藏按钮命中区至少 `44×44px`，阅读窗正文 `15px`、桌面 `16px`。标题使用 `text-wrap: balance`，让中文长标题换行均衡，避免末行孤字。

主次版面的关键不是把首卡机械放大，而是同时调整图像比例、标题、摘要和阅读顺序：

```css
.story-grid-curated {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 25px 46px;
}
.story-lead {
  grid-row: span 3;
  padding-right: 46px;
  border-right: 1px solid var(--line);
}
.story-grid-curated .story:not(.story-lead) {
  display: grid;
  grid-template-columns: 155px minmax(0, 1fr);
  gap: 22px;
}
/* 对照源码中的 800px / 600px / 360px 规则，逐级改为单列和紧凑图文。 */
```

封面按钮增加可见的“阅读封面故事”文字；辅助技术名称仍是“阅读本期封面故事”。筛选同时更新故事数量，但不移动焦点。阅读窗保留具名标题和完整键盘路径。

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

| 状态/函数                                     | 用户行为                       | 复刻时必须保留                                                   |
| --------------------------------------------- | ------------------------------ | ---------------------------------------------------------------- |
| `category`                                    | 全部/空间/物件/日常/已收藏切换 | 过滤真实数组；按钮 `aria-pressed` 同步                           |
| `article` + `dialog`                          | 点击封面、图片或标题阅读       | 原生 `showModal()`、具名标题、关闭与焦点返回                     |
| `saved` + `bookmark(id)`                      | 收藏、取消收藏                 | `folio-saved` 中只接受有效 ID 数组并去重                         |
| `keepReaderFocus`                             | 阅读窗内 Tab/Shift+Tab         | 首末控件循环；Escape 使用原生 dialog 行为                        |
| `email` / `subscribed` / `subscriptionStored` | 输入邮箱并提交                 | HTML 邮箱校验、成功与存储失败分别反馈、编辑后重置反馈            |
| `storageMessage`                              | 浏览器拒绝收藏写入             | 当前页面仍可收藏与筛选，明确刷新后可能丢失；下次成功写入清除提示 |

打开阅读窗时锁定背景滚动，关闭后恢复之前的 `overflow`。遮罩点击先判断坐标是否真的在弹窗边界外，避免点正文留白就关窗。
订阅意向写入 `folio-newsletter-demo`；它不会发邮件，也没有账户、CMS 或真实订阅服务。写入成功才显示“已保存在此浏览器”；被浏览器拒绝时，只显示当前页面已记录、浏览器未能保存。收藏失败提示同时出现在列表和阅读窗内，避免弹窗遮住反馈。

## 验收与本轮真实记录

1. 在 1440px、390px 和 320px 查看整页：封面插画无竖向留边、无横向滚动；梅紫与铜粉颜色一致，星芒不是彩色 emoji。
2. 用键盘聚焦“阅读本期封面故事”，Enter 打开；Tab 在窗口内循环；Escape 关闭后焦点回到原按钮。
3. 收藏一篇、刷新、打开“已收藏”：仅显示该篇；取消最后一篇后出现空状态。空间分类应显示两篇。
4. 在临时测试浏览器把 `folio-saved` 写为 `{}` 或混合重复数组，刷新仍正常；不要在需要保留收藏的个人浏览器做破坏性测试。
5. 输入合法邮箱后显示本地保存反馈；开启减少动态效果偏好后不平滑滚动，文章和导航仍可用。
6. 在隔离测试页拦截 `Storage.prototype.setItem` 并抛出 `QuotaExceededError`，确认收藏在当前页面仍可用，提示刷新可能丢失；邮件意向不能宣称已保存。恢复写入后再操作，提示清除且收藏能在刷新后保留。

本轮实际通过独立构建、仓库 TypeScript 检查、既有 FOLIO 的 5 项 Playwright 测试，以及 [专项脚本](../../artifacts/optimization/verify-editorial.mjs) 的 44 项断言；[结果](../../artifacts/optimization/editorial-results.json) 包含各尺寸实测值。写入失败由真实替换 Storage 方法触发，检查了失败反馈、当前页面操作、刷新丢失与恢复后持久化。

| 优化前观察                                                            | 本轮落地与证据                                                                                                                                                                               |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 四篇等宽卡片，桌面主次不明                                            | 主故事跨三行 + 三篇图文索引；[1440px 前](../../artifacts/optimization/editorial-1440-before.png) / [后](../../artifacts/optimization/editorial-1440-after.png)                               |
| 手机双列长标题和摘要碎行；封面文案与插画由 `520 + 410px` 高度规则撑开 | 390px 封面实测 `758.47px`，完整主故事宽 `352px`，摘要 `14px`；[390px 前](../../artifacts/optimization/editorial-390-before.png) / [后](../../artifacts/optimization/editorial-390-after.png) |
| 320px 阅读密度和中文断行欠佳                                          | 单列主故事、其余 88px 图文索引，均衡标题断行；[320px 前](../../artifacts/optimization/editorial-320-before.png) / [后](../../artifacts/optimization/editorial-320-after.png)                 |
| 阅读正文偏小；收藏失败没有可见说明                                    | 放大阅读正文，增加诚实的存储反馈；[阅读窗](../../artifacts/optimization/editorial-reader-390-after.png) / [写入失败](../../artifacts/optimization/editorial-storage-failure-390.png)         |

复验：构建并运行根预览后，执行 `node artifacts/optimization/verify-editorial.mjs`；它使用隔离浏览器上下文，不修改个人浏览器的数据。截图是本环境 Chromium 的实际输出，字体在其他系统可能不同。

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
