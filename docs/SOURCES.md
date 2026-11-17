# UI / UX 研究来源与证据

核验日期：2026-11-17（Asia/Singapore）。这是覆盖多类风格的第一批代表性研究，不是“市面上所有设计”的完整目录，也不声称浏览过全部社交媒体。

## 本次取得了什么

- 30 个精选入口，覆盖商业设计系统、无障碍交互、实验排版、空间图形、手绘、生成艺术、数据可视化、视频和社交媒体。
- 17 个来源实际取得并阅读了官方 GitHub README、文档或示例源码。`verified` 只表示文档内容已核验，不表示所有示例已运行、线上产品已试用，或演示画面已观看。
- 13 个平台请求被当前环境的网络代理以 `CONNECT 403 Forbidden` 拒绝，标为 `blocked`。这不是平台失效或需要登录的证据。没有将失败请求写成成功浏览。
- B 站和 YouTube 在受阻入口中；本次没有看过、下载或转录具体视频，没有虚构作者、视频标题、时间戳或播放量。
- 官方文档站与 GitHub 官方仓库是独立证据。例如 Material 主站受阻，但 Material Web 的 Theming 文档可读取；Codrops 主站受阻，但官方滚动文字示例仓库可读取。

机器可读索引在 [`src/data/sources.json`](../src/data/sources.json)。每条含实际核验地址 `evidenceUrl`、阅读范围 `evidence`、短摘录 `excerpt` 和核验日期。外部链接随时间可能变化，本批没有固定上游文档的 Git 提交，因此后续复查应重新核验版本。

## 从资料到实现：可复用的设计结论

以下“推导”是项目自己的实现建议，不冒充上游原话。展示站是模式研究与原创组合，不是未经观测的具体站点逐像素复制。

| 实际阅读的内容 | 研究推导 | 复刻时如何验收 |
| --- | --- | --- |
| Material Web `Theming / Tokens` 区分 reference、system、component 三层 | 先定义基础色值，再定义语义角色，组件引用角色；切换风格时主要替换令牌 | 切换背景、主色和圆角后，按钮、卡片与标签都保持一致；正文对比度不能随意损失 |
| Carbon `Packages` 区分 grid、layout、colors、motion、themes | 将信息密度、布局、颜色和动效分开控制；商业 UI 不必依赖复杂装饰 | 桌面网格与移动端单列均可读；间距有统一尺度；主次动作清楚 |
| Radix `Dialog / Highlights / Anatomy / Content` 的焦点约束、标题、描述、Esc 和焦点返回 | 弹窗的“还原”包含行为；图片上看不见的键盘逻辑也属于 UX | 键盘打开后焦点进入弹窗；Tab 不离开模态；Esc 关闭；焦点回到触发元素 |
| React Aria README 把行为、状态和外观区分为不同库 | 视觉皮肤可变化，输入方式应保持等价 | 同一操作可通过鼠标、触摸与键盘完成；按钮有明确名称 |
| cmdk README 的过滤、关键词、空态、加载与嵌套 pages | 检索流程要设计结果之外的状态；关键词可以帮助跨术语查找 | 搜索结果有正确匹配；无匹配时提供清除入口；键盘不丢失当前位置 |
| GSAP README 的 ScrollTrigger、FLIP、matchMedia；Motion README 的手势、弹簧、布局与时间轴 | 动效服务于状态变化和视觉顺序；先明确触发条件，再选择工具 | 同一动作重复触发时不叠加失控；减少动态效果偏好下内容仍完整 |
| Lenis `Setup / Nested scroll / Limitations` | 平滑滚动不是必要前提；模态、内嵌区域、锚点和滚动定位应优先可靠 | 弹窗内部能滚动；锚点能定位；不用惯性层时功能仍工作；不直接混用不兼容的 CSS scroll-snap |
| Three.js `Usage` 的 scene/camera/mesh/renderer；R3F 的点击、悬停和 useFrame 示例 | 装饰场景与业务文本分离，连续动画与离散交互状态分离 | 连续绘制不触发每帧 React 状态更新；隐藏或缩小时处理资源；保留 DOM 操作入口 |
| Rough.js `Filling / Sketching style` 的 roughness、bowing、hachure；Excalidraw 功能表 | 不规则笔触可带来亲和力，但内容布局、撤销、导出和操作范围仍要稳定 | 文字不随笔触扭曲；装饰不阻挡输入；若提供编辑功能则要能撤销 |
| p5.js `setup/draw` 与 `About` 的创意编程定位；D3 的数据驱动图形定位 | 把“视觉规则”和“交互输入”提炼为参数；将同一数据复用到图形和文字说明 | 改一个参数即可看见可解释的变化；图形不是信息的唯一承载形式 |

### 有意识地避免的误读

- 上游 README 的性能宣传不是本项目测量结果，不能据此承诺 120 fps。
- 文档包含“可访问”声明不代表本项目自动符合某项标准，仍需本地键盘和视觉检查。
- Codrops 已进一步阅读示例 JS/CSS，可以核验动画参数；未在浏览器运行原版，所以仍不能宣称已观察过全部转场表现。
- 工具库本身不是风格。相同 GSAP 或 CSS 能实现完全不同的商业、编辑、游戏和艺术视觉。

## 视频平台研究路径

本节是可执行的后续研究流程，不是已完成的视频笔记。

### B 站检索组合

优先从以下关键词组合开始，按更新时间、完整案例、有源码或 Figma 原型进行交叉筛选。搜索排序不等同质量排序。

| 方向 | 中文检索组合 | 需要记录的细节 |
| --- | --- | --- |
| 商业产品 | `UI 设计 SaaS 仪表盘`、`设计系统 Figma 变量 Auto Layout` | 信息层级、表格密度、状态反馈、组件复用 |
| 动效还原 | `GSAP ScrollTrigger 网页复刻`、`Figma 交互动效 曲线` | 触发点、起止状态、时长、缓动、滚动锁定 |
| 编辑与字体 | `动态排版 网页设计`、`瑞士平面 海报 网页` | 字号比例、行长、字距、网格、非对称平衡 |
| 实验与空间 | `Three.js 创意网页`、`WebGL shader 网站` | DOM 与画布分工、灯光、材质、镜头与性能 |
| 游戏与 HUD | `游戏 UI 界面 动效`、`科幻 HUD 网页` | 战斗/菜单状态、响应速度、可读性、手柄或键盘焦点 |
| 非商业与趣味 | `创意编程 p5.js`、`手绘风 网页设计` | 规则生成、随机性、输入映射、反馈与探索成本 |
| UX 实践 | `用户体验 可用性测试 案例`、`信息架构 任务流程` | 用户任务、观察方法、失败路径与验证证据 |

### 其他视频与社交平台

- YouTube：`creative web design interaction`、`GSAP typography scroll`、`accessible dialog keyboard`、`creative coding p5js`。先对照官方 API，避免复制过时语法。
- Dribbble / Behance：区分静态视觉稿、动画样片与真实产品；收集完整流程，不能用首屏美观代替可用性。
- Figma Community：优先看组件变量、响应式约束和状态集；文件可下载不等于素材可任意商用。
- Are.na：按主题组织跨媒介参考，再将视觉关系翻译为网页规则，例如重复、密度、节奏和留白。
- 小红书、抖音、Instagram、Pinterest 等可作为后续拓展方向；本批未实查这些平台，因此未将其列为已验证来源。

### 一条视频的标准笔记模板

```text
来源 URL：
作者 / 标题 / 发布时间：
核验日期 / 视频是否完整可观看：
片段时间（如 02:14–02:29）：
用户正在完成的任务：
界面前态 → 用户动作 → 界面后态：
布局：列数、最大宽度、间距、断点
视觉：字体层级、颜色角色、图形与材质
动效：触发、延迟、时长、缓动、运动范围
输入方式：鼠标、触摸、键盘；减少动态效果模式
异常：无结果、加载、失败、重复点击、慢设备
实现假设（与实际观测分开）：
作者提供的源码 / 文件 / 许可：
本地实现位置与截图：
差异、原因和待验证问题：
```

研究顺序：完整观看一次 → 选一个有明确行为的片段 → 记录起止状态与时间 → 静态重建 → 加交互 → 加动效 → 同屏或逐帧对照 → 记录差异。只有拿到具体视频或页面的可观察内容，才将对应条目升级为已核验案例。

## 网络范围与后续补充

本次失败请求对应的主机如下：`www.awwwards.com`、`godly.website`、`www.siteinspire.com`、`tympanus.net`、`www.nngroup.com`、`m3.material.io`、`developer.apple.com`、`search.bilibili.com`、`www.youtube.com`、`dribbble.com`、`www.behance.net`、`www.are.na`、`www.figma.com`。

若后续环境允许这些域名，应先重试具体页面，再按实际请求识别必要的资源域名；不因主页面通过就声称视频播放器或登录工作。当前研究没有替换网络规则，也没有绕过站点或平台访问限制。

## 来源目录

以下目录由 `sources.json` 同步生成。状态为“文档已读”的条目也明确保留阅读深度；“访问受阻”的内容仅是推荐研究方向。

### Material · 设计令牌

- 状态：文档已读 · 设计系统 · 2026-11-17
- 入口：[Material · 设计令牌](https://github.com/material-components/material-web/blob/main/docs/theming/README.md)
- 实际核验地址：[原文请求](https://raw.githubusercontent.com/material-components/material-web/main/docs/theming/README.md)
- 阅读证据：已读取官方 Theming 的 Tokens、Reference、System、Component 章节；文档明确指出 MWC 当前不支持 palette 和 motion 两类令牌。仅核验文档，未运行组件。
- 研究摘要：将颜色、字阶和圆角组织为 reference → system → component 三层令牌；通过 CSS 自定义属性，让同一组件适配多个品牌。

### Radix · 可访问弹窗

- 状态：文档已读 · 交互规范 · 2026-11-17
- 入口：[Radix · 可访问弹窗](https://github.com/radix-ui/website/blob/main/data/primitives/docs/components/dialog.mdx)
- 实际核验地址：[原文请求](https://raw.githubusercontent.com/radix-ui/website/main/data/primitives/docs/components/dialog.mdx)
- 阅读证据：已读官方 Dialog 文档 Highlights、Anatomy、Content API：模态焦点约束、Esc 关闭、关闭后焦点返回 Trigger、背景不可交互。
- 研究摘要：弹窗必须包含标题、描述、关闭动作以及焦点管理。装饰层可以高度定制，键盘与屏幕阅读器行为需要独立保证。

### React Aria · 交互底座

- 状态：文档已读 · 交互规范 · 2026-11-17
- 入口：[React Aria · 交互底座](https://github.com/adobe/react-spectrum)
- 实际核验地址：[原文请求](https://raw.githubusercontent.com/adobe/react-spectrum/main/README.md)
- 阅读证据：已读 README 的 React Aria、React Stately、Features 和 Getting started：区分无样式组件、状态 hooks 与完整 Spectrum 外观。
- 研究摘要：把无样式的交互行为、状态管理与视觉表现分开；同一个控件需覆盖鼠标、触摸、键盘和国际化需求。

### IBM Carbon · 系统化界面

- 状态：文档已读 · 设计系统 · 2026-11-17
- 入口：[IBM Carbon · 系统化界面](https://github.com/carbon-design-system/carbon)
- 实际核验地址：[原文请求](https://raw.githubusercontent.com/carbon-design-system/carbon/main/README.md)
- 阅读证据：已读 README Packages 表：@carbon/grid、@carbon/layout、@carbon/colors、@carbon/motion、@carbon/themes 的职责；未宣称检查其线上全部组件。
- 研究摘要：将企业界面拆为网格、间距、颜色、图标和动效包。研究启发：工具界面先稳定信息密度与布局尺度，再加入表达性动效。

### shadcn/ui · 可拥有的组件

- 状态：文档已读 · 组件库 · 2026-11-17
- 入口：[shadcn/ui · 可拥有的组件](https://github.com/shadcn-ui/ui)
- 实际核验地址：[原文请求](https://raw.githubusercontent.com/shadcn-ui/ui/main/README.md)
- 阅读证据：已读官方 README 的项目定位、Documentation 与 License 段。该文档说明可定制、扩展和构建自己的组件库；未验证其文档站组件演示。
- 研究摘要：以可修改的组件代码作为设计系统起点，先共享基础控件，再按场景调整外观；不是将整套视觉锁定为唯一模板。

### cmdk · 键盘命令入口

- 状态：文档已读 · 交互规范 · 2026-11-17
- 入口：[cmdk · 键盘命令入口](https://github.com/pacocoursey/cmdk)
- 实际核验地址：[原文请求](https://raw.githubusercontent.com/pacocoursey/cmdk/main/README.md)
- 阅读证据：已读 README 的 Use、filter、keywords、Empty、Loading 与嵌套 pages 示例。文档给出自定义排序和关闭内置过滤的独立方案。
- 研究摘要：命令面板把高频动作收敛到可检索列表。复刻时需提供命名、关键词别名、空结果、加载态及一致的选择反馈。

### Motion · 状态过渡

- 状态：文档已读 · 动效工具 · 2026-11-17
- 入口：[Motion · 状态过渡](https://github.com/motiondivision/motion)
- 实际核验地址：[原文请求](https://raw.githubusercontent.com/motiondivision/motion/main/README.md)
- 阅读证据：已读 README 的功能概览，列出 gestures、springs、layout transitions、scroll-linked effects、timelines；没有实测其宣传帧率。
- 研究摘要：将手势、弹簧、布局变化和滚动联动视为不同动效问题；以组件状态驱动过渡，保持进入、更新、退出的节奏一致。

### GSAP · 时间轴与滚动

- 状态：文档已读 · 动效工具 · 2026-11-17
- 入口：[GSAP · 时间轴与滚动](https://github.com/greensock/GSAP)
- 实际核验地址：[原文请求](https://raw.githubusercontent.com/greensock/GSAP/master/README.md)
- 阅读证据：已读 README 的介绍、npm 导入与 registerPlugin 示例、ScrollTrigger & ScrollSmoother 章节；确认这些是可选插件，而非默认全部加载。
- 研究摘要：用时间轴编排文字与图形出现次序；滚动场景可研究 ScrollTrigger，布局重排研究 FLIP，响应式策略参考 matchMedia。

### Lenis · 滚动协调

- 状态：文档已读 · 动效工具 · 2026-11-17
- 入口：[Lenis · 滚动协调](https://github.com/darkroomengineering/lenis)
- 实际核验地址：[原文请求](https://raw.githubusercontent.com/darkroomengineering/lenis/main/README.md)
- 阅读证据：已读 Setup、GSAP ScrollTrigger、Nested scroll、Limitations：需 RAF 循环；嵌套滚动可用 prevent；原生 CSS scroll-snap 不直接兼容。
- 研究摘要：平滑滚动可以统一视差与 WebGL 的节奏，但嵌套面板需独立处理。原生滚动是可靠基线；引入平滑层前先验证浏览和定位。

### Codrops · 滚动文字实验

- 状态：文档/源码已读 · 实验案例 · 2026-11-17
- 入口：[Codrops · 滚动文字实验](https://github.com/codrops/OnScrollTypographyAnimations)
- 实际核验地址：[原文请求](https://raw.githubusercontent.com/codrops/OnScrollTypographyAnimations/main/src/js/index.js)
- 阅读证据：已读 README，并读取 src/js/index.js、src/css/base.css、src/index.html 和 package.json。核验 effect1/2/4/8 的旋转、拉伸、中心展开和字符替换，及 scrub 与触发边界。原版实时 Demo 未运行；第三方字体与旧版依赖不能直接假定可用。
- 研究摘要：逐字符拆分配合 ScrollTrigger：可从随机旋转/缩放进入，或从单词中心展开；CSS 使用 12vw 大字与 0.8 行高，形成以文字为主体的长页面。

### Three.js · 空间图形

- 状态：文档已读 · 创意编程 · 2026-11-17
- 入口：[Three.js · 空间图形](https://github.com/mrdoob/three.js)
- 实际核验地址：[原文请求](https://raw.githubusercontent.com/mrdoob/three.js/dev/README.md)
- 阅读证据：已读 README Usage 中 PerspectiveCamera、Scene、BoxGeometry、WebGLRenderer 与 setAnimationLoop 示例；README 同时说明 WebGPU 和可选 SVG/CSS3D 渲染器。
- 研究摘要：场景、相机、网格和渲染循环构成空间展示最小骨架。适合展品和材质实验；说明文字及操作仍应由可访问的 DOM 承载。

### React Three Fiber · 可交互场景

- 状态：文档已读 · 创意编程 · 2026-11-17
- 入口：[React Three Fiber · 可交互场景](https://github.com/pmndrs/react-three-fiber)
- 实际核验地址：[原文请求](https://raw.githubusercontent.com/pmndrs/react-three-fiber/master/readme.md)
- 阅读证据：已读 README 的 What does it look like? JSX 示例：useFrame、onPointerOver、onPointerOut、onClick 与 scale；本文未运行原仓库。
- 研究摘要：用组件状态管理悬停与点击，用渲染循环处理连续运动。官方 Box 示例展示了点击缩放、悬停换色与每帧旋转。

### p5.js · 创意编程

- 状态：文档已读 · 创意编程 · 2026-11-17
- 入口：[p5.js · 创意编程](https://github.com/processing/p5.js)
- 实际核验地址：[原文请求](https://raw.githubusercontent.com/processing/p5.js/main/README.md)
- 阅读证据：已读 README 的 setup/draw 指针圆形示例与 About：支持视听、交互、实验和生成作品，强调可访问性与包容性。
- 研究摘要：将网页视为草图：输入坐标驱动几何绘制，以简单规则生成连续变化。适合教育、艺术实验和情绪性界面。

### Rough.js · 手绘视觉

- 状态：文档已读 · 创意编程 · 2026-11-17
- 入口：[Rough.js · 手绘视觉](https://github.com/rough-stuff/rough)
- 实际核验地址：[原文请求](https://raw.githubusercontent.com/rough-stuff/rough/master/README.md)
- 阅读证据：已读 Usage、Lines and Ellipses、Filling、Sketching style、SVG Paths：支持 Canvas 与 SVG，提供 hachure、solid、dots 等填充。
- 研究摘要：用 roughness、bowing 与不同填充纹理建立手绘质感。装饰可以不规则，文字对齐和点击范围仍应保持稳定。

### Excalidraw · 手绘协作工具

- 状态：文档已读 · 产品案例 · 2026-11-17
- 入口：[Excalidraw · 手绘协作工具](https://github.com/excalidraw/excalidraw)
- 实际核验地址：[原文请求](https://raw.githubusercontent.com/excalidraw/excalidraw/master/README.md)
- 阅读证据：已读 README Features：无限画布、手绘样式、暗色、形状库、PNG/SVG 导出、JSON 文件、Undo/Redo、Zoom/Panning；未测试其在线协作服务。
- 研究摘要：手绘视觉可以承载专业工具体验：无限画布、撤销重做、缩放、导出和开放文件格式比装饰更决定可用性。

### D3 · 数据驱动视觉

- 状态：文档已读 · 创意编程 · 2026-11-17
- 入口：[D3](https://github.com/d3/d3)
- 实际核验地址：[线性尺度原文](https://raw.githubusercontent.com/d3/d3/main/docs/d3-scale/linear.md)、[坐标轴原文](https://raw.githubusercontent.com/d3/d3/main/docs/d3-axis.md)、[数值格式原文](https://raw.githubusercontent.com/d3/d3/main/docs/d3-format.md)
- 阅读证据：已进一步读取官方 docs/d3-scale/linear.md 的 domain/range/scaleLinear，docs/d3-axis.md 的刻度更新，以及 docs/d3-format.md 的统一精度、货币、百分比与地区格式示例。未运行官方可视化示例。
- 研究摘要：连续数值用线性尺度保持比例关系；轴提供可读参考，切换时间范围时应同步刻度；金额固定精度、百分比带符号，避免浮点噪音影响比较。

### Embla · 触摸轮播

- 状态：文档已读 · 交互工具 · 2026-11-17
- 入口：[Embla · 触摸轮播](https://github.com/davidjerleke/embla-carousel)
- 实际核验地址：[原文请求](https://raw.githubusercontent.com/davidjerleke/embla-carousel/master/README.md)
- 阅读证据：已读官方 README 项目说明，确认轻量、无运行时依赖、框架无关与滑动定位方向；按钮及位置提示属于本知识库的设计推导，并非已核验的默认配置。
- 研究摘要：在产品与作品横向浏览场景研究滑动和定位。复刻方案应同时提供清晰按钮与当前位置，不能只有隐蔽手势。

### Awwwards · 获奖网站

- 状态：访问受阻 · 灵感平台 · 2026-11-17
- 入口：[Awwwards · 获奖网站](https://www.awwwards.com/)
- 实际核验地址：[原文请求](https://www.awwwards.com/)
- 阅读证据：实际请求被当前环境的网络代理拒绝：CONNECT 403 Forbidden。未取得页面内容，未观看视频；本条仅为后续研究入口。
- 研究摘要：后续重点：品牌网站的首屏构图、滚动叙事与转场。当前未读取具体获奖作品，不给出虚构榜单或评分。

### Godly · 创意网页

- 状态：访问受阻 · 灵感平台 · 2026-11-17
- 入口：[Godly · 创意网页](https://godly.website/)
- 实际核验地址：[原文请求](https://godly.website/)
- 阅读证据：实际请求被当前环境的网络代理拒绝：CONNECT 403 Forbidden。未取得页面内容，未观看视频；本条仅为后续研究入口。
- 研究摘要：后续重点：强视觉网页的排版尺度、媒介组合和动效节奏。平台入口待访问。

### SiteInspire · 网页索引

- 状态：访问受阻 · 灵感平台 · 2026-11-17
- 入口：[SiteInspire · 网页索引](https://www.siteinspire.com/)
- 实际核验地址：[原文请求](https://www.siteinspire.com/)
- 阅读证据：实际请求被当前环境的网络代理拒绝：CONNECT 403 Forbidden。未取得页面内容，未观看视频；本条仅为后续研究入口。
- 研究摘要：后续重点：通过行业、布局和风格建立对照组，避免只收集相似首屏。平台内容待核验。

### Codrops · 教程主站

- 状态：访问受阻 · 教程平台 · 2026-11-17
- 入口：[Codrops · 教程主站](https://tympanus.net/codrops/)
- 实际核验地址：[原文请求](https://tympanus.net/codrops/)
- 阅读证据：实际请求被当前环境的网络代理拒绝：CONNECT 403 Forbidden。未取得页面内容，未观看视频；本条仅为后续研究入口。
- 研究摘要：主站访问受阻；本知识库另收录已读的官方 GitHub 滚动文字项目，两者核验状态分开记录。

### NN/g · 用户体验研究

- 状态：访问受阻 · 研究文档 · 2026-11-17
- 入口：[NN/g · 用户体验研究](https://www.nngroup.com/articles/)
- 实际核验地址：[原文请求](https://www.nngroup.com/articles/)
- 阅读证据：实际请求被当前环境的网络代理拒绝：CONNECT 403 Forbidden。未取得页面内容，未观看视频；本条仅为后续研究入口。
- 研究摘要：后续重点：任务完成、信息气味、识别与回忆、导航和可用性测试。当前未读取具体文章，不能代替用户研究证据。

### Material Design · 文档站

- 状态：访问受阻 · 设计文档 · 2026-11-17
- 入口：[Material Design · 文档站](https://m3.material.io/)
- 实际核验地址：[原文请求](https://m3.material.io/)
- 阅读证据：实际请求被当前环境的网络代理拒绝：CONNECT 403 Forbidden。未取得页面内容，未观看视频；本条仅为后续研究入口。
- 研究摘要：官方站点待核验；已读取的 Material Web Theming 仓库文档作为独立来源，不能视作浏览完整 Material 3 规范。

### Apple HIG · 平台体验

- 状态：访问受阻 · 设计文档 · 2026-11-17
- 入口：[Apple HIG · 平台体验](https://developer.apple.com/design/human-interface-guidelines/)
- 实际核验地址：[原文请求](https://developer.apple.com/design/human-interface-guidelines/)
- 阅读证据：实际请求被当前环境的网络代理拒绝：CONNECT 403 Forbidden。未取得页面内容，未观看视频；本条仅为后续研究入口。
- 研究摘要：后续重点：平台导航、反馈、层级与空间交互。当前未读取最新 HIG 页面，不推断版本变化。

### B站 · UI 与交互教程

- 状态：访问受阻 · 视频平台 · 2026-11-17
- 入口：[B站 · UI 与交互教程](https://search.bilibili.com/all?keyword=UI%20%E4%BA%A4%E4%BA%92%E5%8A%A8%E6%95%88)
- 实际核验地址：[原文请求](https://search.bilibili.com/all?keyword=UI%20%E4%BA%A4%E4%BA%92%E5%8A%A8%E6%95%88)
- 阅读证据：实际请求被当前环境的网络代理拒绝：CONNECT 403 Forbidden。未取得页面内容，未观看视频；本条仅为后续研究入口。
- 研究摘要：检索入口：UI 交互动效。进一步组合 Figma 原型、网页复刻、GSAP 滚动、游戏 UI、字体海报等关键词；未观看或转录任何具体视频。

### YouTube · Creative web design

- 状态：访问受阻 · 视频平台 · 2026-11-17
- 入口：[YouTube · Creative web design](https://www.youtube.com/results?search_query=creative+web+design+interaction)
- 实际核验地址：[原文请求](https://www.youtube.com/results?search_query=creative+web+design+interaction)
- 阅读证据：实际请求被当前环境的网络代理拒绝：CONNECT 403 Forbidden。未取得页面内容，未观看视频；本条仅为后续研究入口。
- 研究摘要：检索入口：creative web design interaction。后续需核验作者、发布时间、演示和源码；当前未观看视频。

### Dribbble · 视觉概念

- 状态：访问受阻 · 社交平台 · 2026-11-17
- 入口：[Dribbble · 视觉概念](https://dribbble.com/shots/popular/web-design)
- 实际核验地址：[原文请求](https://dribbble.com/shots/popular/web-design)
- 阅读证据：实际请求被当前环境的网络代理拒绝：CONNECT 403 Forbidden。未取得页面内容，未观看视频；本条仅为后续研究入口。
- 研究摘要：后续重点：卡片、品牌配色与微交互。需区分概念图、动效演示与真实可用产品；当前未采集作品。

### Behance · 完整设计项目

- 状态：访问受阻 · 社交平台 · 2026-11-17
- 入口：[Behance · 完整设计项目](https://www.behance.net/search/projects?search=experimental%20web%20design)
- 实际核验地址：[原文请求](https://www.behance.net/search/projects?search=experimental%20web%20design)
- 阅读证据：实际请求被当前环境的网络代理拒绝：CONNECT 403 Forbidden。未取得页面内容，未观看视频；本条仅为后续研究入口。
- 研究摘要：检索入口：experimental web design。后续优先收集有设计过程、桌面与移动端展示的完整项目。

### Are.na · 非商业视觉研究

- 状态：访问受阻 · 社交平台 · 2026-11-17
- 入口：[Are.na · 非商业视觉研究](https://www.are.na/)
- 实际核验地址：[原文请求](https://www.are.na/)
- 阅读证据：实际请求被当前环境的网络代理拒绝：CONNECT 403 Forbidden。未取得页面内容，未观看视频；本条仅为后续研究入口。
- 研究摘要：后续重点：图像、文字、艺术和网页媒介的跨领域关联，建立主题板；当前未读取具体 channel。

### Figma Community · 设计文件

- 状态：访问受阻 · 样例库 · 2026-11-17
- 入口：[Figma Community · 设计文件](https://www.figma.com/community)
- 实际核验地址：[原文请求](https://www.figma.com/community)
- 阅读证据：实际请求被当前环境的网络代理拒绝：CONNECT 403 Forbidden。未取得页面内容，未观看视频；本条仅为后续研究入口。
- 研究摘要：后续重点：带 Auto Layout、变量、组件状态与交互原型的源文件；下载前核验作者和单个文件的使用许可。

## 深入样例：Codrops 滚动文字的机制拆解

实际阅读了官方仓库的 [`src/js/index.js`](https://github.com/codrops/OnScrollTypographyAnimations/blob/main/src/js/index.js)、[`src/css/base.css`](https://github.com/codrops/OnScrollTypographyAnimations/blob/main/src/css/base.css)、HTML 与 package.json。以下是代码观测，不是视频或运行观察。

- **文字是图形主体**：标题使用 `font-size: 12vw`、`line-height: 0.8`；段落限制宽度，与巨幅标题形成尺度对比。`.char-wrap` 通过 `overflow: hidden` 提供字形揭示窗口。
- **拆分层次**：Splitting 先生成字符/单词节点；某些效果按整标题处理字符，另一些先按单词分组，因此节奏可以按字或按词推进。
- **effect1：从散乱到秩序**：初态透明度 0、缩放 0.6、Z 轴随机 -20° 至 20°；结束为正常大小、正常角度、不透明；`scrub: true` 把变化绑定到滚动区间。
- **effect2：拉伸入场**：初始 `yPercent: 120`，纵向拉长到 2.3、横向缩窄到 0.7，再回到正常比例。需要单独审查字体可读性和减弱动态效果版本。
- **effect4：由中心展开**：每个字符的横向偏移来自字符序号相对单词中心的位置，`stagger.from: center` 改变进入顺序；这与固定的从左到右序列有不同节奏。
- **effect8：字符替换**：短暂替换为随机符号后恢复原文。实现需保留完整可读文本给辅助技术，不能让读屏器逐帧播报随机字符。上游代码不自动保证本项目的可访问性。
- **复刻前的适配**：该项目依赖旧包名 `@studio-freight/lenis`、GSAP 3.11 系列与外部 Typekit/WebFont。应核验兼容版本、替换为有许可的本地字体，并移除不需要的外部分析脚本；不要直接运行未经检查的远端页面。

本次没有复制原站图片、字体或完整源码到展示站。可复用知识是字形分组、滚动区间、空间变换、尺度对比与逐项节奏。

领域专项研究见 [公共服务与数据可读性笔记](DATA-SERVICE-NOTES.md)。
