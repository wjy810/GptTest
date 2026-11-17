# 从观察到复刻：十二个独立网站的实作手册

本项目把不同来源中的设计方法整理成十二个独立网站，适合练习布局、视觉语言和状态设计。每个站点拥有自己的 HTML 入口、页面结构、样式和用户任务，可分别启动、构建和部署；目录页只是索引，不是包裹所有样例的应用框架。它不是某个站点的逐像素复制，也不是对全部市场的完整盘点。研究来源及访问证据见 [SOURCES.md](SOURCES.md)，视频取证流程见 [RESEARCH-METHOD.md](RESEARCH-METHOD.md)。下面的尺寸与时间是**建议的练习基线**，当前实现以源码为准。

## 先跑起来，再开始拆解

在仓库根目录安装依赖后，使用站点名选择独立 Vite root：

```bash
npm ci
npm run dev -- --mode editorial
# 构建单站
npm run build -- --mode editorial
# 构建所有独立站点
npm run build:all
```

站点清单：`editorial`、`brutalist`、`swiss`、`glass`、`terminal`、`organic`、`restaurant`、`travel`、`fintech`、`civic`、`arcade`、`architecture`。每个输出位于 `dist/<站点名>`，可以独立部署。实际端口与完整命令见根目录 [README](../README.md)。

- [`apps/editorial`](../apps/editorial)：编辑杂志。
- [`apps/brutalist`](../apps/brutalist)：创意工作室。
- [`apps/swiss`](../apps/swiss)：展览与文化。
- [`apps/glass`](../apps/glass)：音乐与媒体。
- [`apps/terminal`](../apps/terminal)：开发者工具。
- [`apps/organic`](../apps/organic)：生活方式。
- [`apps/restaurant`](../apps/restaurant)：餐厅与菜单。
- [`apps/travel`](../apps/travel)：目的地与行程。
- [`apps/fintech`](../apps/fintech)：金融产品。
- [`apps/civic`](../apps/civic)：公共服务。
- [`apps/arcade`](../apps/arcade)：游戏与像素。
- [`apps/architecture`](../apps/architecture)：建筑事务所。

各站的 `index.html` 是独立入口，`src/main.tsx` 包含其页面与交互，`src/styles.css` 定义自己的视觉语言。根目录共用开发依赖；运行时不需要其他站点。来源数据见 [`src/data/sources.json`](../src/data/sources.json)。

先完整体验一个站点的用户任务，再调整结构和 token。不要把所有站点统一改成同一个卡片页面：餐厅需要菜单与预约，旅行需要目的地选择与预算，展览需要活动与日程。风格应与任务共同决定界面。

## 通用施工顺序

1. **写任务与状态。** 用户从哪里进入、要完成什么、成功后出现什么。至少列出默认、聚焦、选中、进行中、成功、失败和空结果。
2. **画灰度骨架。** 先放标题、辅助说明、主操作和内容。不要依赖图片或渐变才能看懂层级。
3. **建立尺度。** 先定义容器宽度、间距、字号、圆角和颜色变量，再写组件。建议用 4/8 像素递增的间距。
4. **加视觉识别。** 一次只引入一到两个主要特征，例如夸张字号与硬阴影。装饰要服务内容。
5. **补全交互。** hover 之外也处理 focus、active、disabled；用真实状态控制预览，避免按钮仅播放装饰动画。
6. **做移动端。** 首先减少列数与装饰，再调整字号；不要简单缩小整张桌面画布。
7. **校验与记录。** 从 320px 到宽屏检查溢出，使用键盘操作，开启减少动态效果，并记录参数与取舍。

## 01 · Editorial / 编辑排版

**适用任务：** 文化专题、作品集、长篇故事、展览介绍。核心是标题、图片、图注之间有清楚的阅读顺序。

**搭建步骤：**

1. 桌面使用 12 列网格，标题占 7 列、说明占 4 列，中间留空；内容区把大图与小图错开。
2. 给标题设 56–112px 的流体字号、0.9–1.0 行高；正文保留 16–18px、1.6 行高，不要照搬标题的紧密字距到中文正文。
3. 限制正文行宽在 32–42 个汉字附近。用细线、栏目编号、日期与图注组织层级。
4. 默认米白底、近黑正文、少量朱红；把图片当成内容，不要让它替代标题的可读性。

```css
.editorial-demo {
  --paper: #f1eee6;
  --ink: #22211e;
  background: var(--paper);
  color: var(--ink);
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 24px;
  padding: clamp(20px, 4vw, 56px);
}
.editorial-demo h1 {
  grid-column: span 8;
  margin: 0;
  font-size: clamp(3rem, 7vw, 7rem);
  line-height: 0.95;
  letter-spacing: -0.045em;
}
.editorial-demo .copy {
  grid-column: span 4;
  line-height: 1.7;
}
@media (max-width: 640px) {
  .editorial-demo h1,
  .editorial-demo .copy {
    grid-column: 1 / -1;
  }
}
```

**状态与动效：** 章节选中时同时改变文字与下划线；切换章节用 180–240ms 淡入，避免整页飞入打断阅读。图片放大必须有明确返回方式与 Escape 关闭。

**移动端与键盘：** 先标题、再摘要、再图片，DOM 顺序与视觉顺序一致。正文内链接应可辨识，不只依赖鼠标悬停。减少动态效果时直接切换内容。

**练习：** 用自写的展览介绍做两版首页，一版大标题、一版大图片。让旁人看五秒后说出主题与下一步操作，比较信息是否同样明确。

## 02 · Brutalist / 粗野与硬边

**适用任务：** 音乐活动、独立出版、创意工具、实验品牌。高对比和粗线条建立视觉冲击，但按钮仍须遵循一致的交互约定。

**搭建步骤：**

1. 选一个高饱和底色，例如黄绿色，搭配黑白；不要让每个模块都有不同的高饱和色。
2. 使用 2–3px 实线边框、近乎无圆角、大字号、偏移硬阴影。
3. 保持真实网格，仅让一个贴纸或标题轻微倾斜。倾斜不用于正文和表单。
4. 主按钮用清楚动词，例如“加入清单”，选中后显示“已加入”及图标。

```css
.brutal-button {
  border: 3px solid #111;
  border-radius: 0;
  background: #d8ff36;
  color: #111;
  box-shadow: 5px 5px 0 #111;
  padding: 14px 22px;
  font:
    800 1rem/1.2 system-ui,
    sans-serif;
  transition:
    transform 120ms ease-out,
    box-shadow 120ms ease-out;
}
.brutal-button:active {
  transform: translate(3px, 3px);
  box-shadow: 2px 2px 0 #111;
}
.brutal-button:focus-visible {
  outline: 3px solid #b62d00;
  outline-offset: 5px;
}
```

**状态与动效：** 用 2–3px 位移模拟按压；选中状态补上文字或勾选，不能只把黄底改绿底。不要做快速闪烁来表现“朋克”。

**移动端与键盘：** 点击热区建议至少 44×44px。硬阴影在窄屏容易溢出，要预留右下空间。卡片选择用 `<button>` 或带 `<label>` 的 radio，不用只绑定点击事件的 `<div>`。

**练习：** 做三张票种卡片，选中一张后更新价格汇总；提交成功给出稳定反馈，并保留返回修改的路径。

## 03 · Swiss / 瑞士网格

**适用任务：** 会议、建筑、博物馆、信息索引。依靠对齐、比例与留白形成秩序，而不是大量卡片边框。

**搭建步骤：**

1. 用 12 列网格，统一边距和 24px 列间距。日期、分类、标题都找得到共同的对齐线。
2. 选一套无衬线字体，用字号和字重区分层级。可用 64/32/18/12 的英文尺度，中文应单独检查字面大小。
3. 白底、黑字、单一红色强调。线条只用于分组和分隔，不给所有元素都加框。
4. 编号既能提供节奏，也应对应真实章节或条目。

```css
.swiss-list {
  border-top: 1px solid currentColor;
}
.swiss-row {
  display: grid;
  grid-template-columns: 60px minmax(0, 1fr) 100px;
  gap: 24px;
  padding-block: 24px;
  border-bottom: 1px solid currentColor;
}
.swiss-row [aria-pressed='true'] {
  color: #b92b18;
}
@media (max-width: 640px) {
  .swiss-row {
    grid-template-columns: 36px minmax(0, 1fr);
    gap: 12px;
  }
  .swiss-row .meta {
    grid-column: 2;
  }
}
```

**状态与动效：** 排序时保留选中项及焦点。排序方向应有文字或 `aria-label`，不要只显示一个无法解释的箭头。轻量反馈 120–180ms 即可。

**移动端与键盘：** 隐藏装饰列，保留内容关系；表格确需二维比较时提供横向滚动并标明。排序按钮必须可用 Enter/Space 操作。

**练习：** 制作活动日程，可按时间或主题排序。对比变换后，用户是否仍能找到刚才查看的活动。

## 04 · Glass / 玻璃与景深

**适用任务：** 媒体控制、轻量仪表盘、环境工具。半透明层表达前后关系，背景必须稳定支撑前景文字。

**搭建步骤：**

1. 背景用少量大色团，避免高频纹理穿透卡片。
2. 先用不透明卡片完成层级，再逐步增加透明度和模糊。
3. 容器圆角建议 24–32px；卡片之间用空间分隔，不需要每层都叠加重阴影。
4. 模糊保持 12–20px，限制同时使用的模糊层；移动设备上优先保证滚动与滑条流畅。

```css
.glass-panel {
  background: #f1edf9; /* 不支持模糊时仍有可读背景 */
  color: #272034;
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 28px;
  box-shadow: 0 16px 48px rgba(35, 20, 60, 0.12);
}
@supports (backdrop-filter: blur(16px)) {
  .glass-panel {
    background: rgba(250, 248, 255, 0.78);
    backdrop-filter: blur(16px);
  }
}
```

**状态与动效：** 滑条应实时更新数值和可感知预览；拖动时不要给数值更新添加额外的延迟动画。播放按钮若只演示 UI，写明“预览”，不要暗示已经播放真实音频。

**移动端与键盘：** 原生 `<input type="range">` 配 `<label>`、最小值和最大值，箭头键可调整。减少动态效果时停止漂浮色团，保留必要的状态反馈。

**练习：** 实现环境强度滑条，改变背景亮度并同步显示百分比。在最亮与最暗背景下分别检查文字对比度。

## 05 · Terminal / 终端与信息仪表

**适用任务：** 开发者工具、系统状态、科技叙事、游戏控制台。复古外观不能取代真实状态说明。

**搭建步骤：**

1. 深近黑背景，绿色强调，低饱和灰绿作为次级文字。正文仍需足够对比度。
2. 标识、数字和命令用等宽字体，长篇中文说明可用系统字体。
3. 信息按“当前状态 → 操作 → 结果”排序。日志按时间组织并标识错误与成功。
4. 局部扫描线只作为可关闭装饰，不能盖住文本或干扰选中复制。

```css
.terminal-demo {
  background: #101712;
  color: #b8efc1;
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  padding: 24px;
}
.terminal-demo pre {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  line-height: 1.7;
}
.terminal-demo .status {
  border-left: 3px solid #8edca0;
  padding-left: 12px;
}
```

**状态与动效：** 演示命令必须明确是本地模拟；按钮提供运行中、完成、错误等状态。日志区域可用 `role="log"`，但避免每 100ms 刷新屏幕阅读器内容。不要把打字动画放在必须立即阅读的关键信息上。

**移动端与键盘：** 命令允许换行；快捷键应说明作用域，避免妨碍浏览器的原有操作。减少动态效果时可直接呈现纯装饰性的打字内容；真正异步任务仍应展示实际执行进度，不能伪造提前完成。当前 TRACE 的逐行日志属于明确标注的本地模拟，降低动态效果会停用装饰动画，并不改变该模拟的计时流程。错误同时使用文字与图标，不能只把绿色改为红色。

**练习：** 实现“检查组件”模拟流程，生成可解释的成功和失败示例，并提供重新运行按钮。保留日志上限，避免无限增长。

## 06 · Organic / 有机与柔和

**适用任务：** 生活方式、健康习惯、自然主题、轻社交。视觉柔和仍需清楚说明可操作内容。

**搭建步骤：**

1. 选择奶油白、鼠尾草绿、深橄榄色三层色彩，重要文字使用最深层。
2. 模块采用 24–40px 圆角；叶片和不规则色块只出现在装饰层。
3. 留白和行高宽松，按钮保持边界感。不要把所有元素都做成同样的圆形。
4. 用具体小目标，例如“完成一次 2 分钟练习”，让用户知道下一步。

```css
.organic-card {
  background: #e4ebdc;
  color: #293d2b;
  border-radius: 32px;
  padding: clamp(20px, 4vw, 40px);
}
.organic-card .primary {
  background: #304c36;
  color: #fff;
  border: 0;
  border-radius: 999px;
  padding: 14px 24px;
}
```

**状态与动效：** 选择偏好时更新摘要；进度不得编造。呼吸式装饰动画建议周期至少 4 秒，提供暂停。成功反馈用文案与状态变化，避免必须等待的庆祝动画。

**移动端与键盘：** 大圆角不要吃掉窄屏正文空间。装饰 SVG 设置 `aria-hidden="true"`；真正传递数据的图形提供文字等价信息。减少动态效果时静态展示当前进度。

**练习：** 做一组可多选的兴趣标签，实时汇总选择，清空后展示解释性空状态。

## 所有风格共用的无障碍底线

```css
button,
a,
input,
select,
textarea {
  -webkit-tap-highlight-color: transparent;
}
:focus-visible {
  outline: 3px solid #215aca;
  outline-offset: 4px;
}
@media (prefers-reduced-motion: reduce) {
  .demo-animated {
    animation: none;
    transition: none;
    scroll-behavior: auto;
  }
}
```

不要用 `outline: none` 清除所有焦点。普通正文目标对比度至少 4.5:1，大字至少 3:1；控件边界和必要状态信息也要检查。半透明界面应检查叠加后的实际颜色，不能只检查 CSS 中的颜色值。

模态详情需要：打开后焦点进入面板、Tab 不跑到背景、Escape 关闭、关闭后焦点回到入口；移动端可滚动且关闭按钮持续可达。手工与自动化结果应记录为“通过 / 失败 / 未测”，不能把清单本身当作测试完成。

## 如何判断复刻已经完成

| 维度     | 需要的证据                         | 常见未完成信号                 |
| -------- | ---------------------------------- | ------------------------------ |
| 结构     | 桌面与手机布局截图                 | 只在一种窗口宽度看起来正常     |
| 交互     | 完整执行一次任务并验证结果         | 所有按钮只改变颜色             |
| 状态     | 默认、空、错误、选中与成功示例     | 不存在失败路径                 |
| 可访问性 | 键盘完成任务、可见焦点、降动效检查 | hover 才能发现操作             |
| 可维护性 | 明确 token、组件边界、数据来源     | 数值散落、内容写死在重复卡片里 |
| 来源     | 原始链接、访问状态、具体借鉴点     | 只写“参考某平台”               |

推荐每次完成一个风格后写一段复盘：**保留了什么原则 → 哪些参数做了调整 → 哪个任务变得更易完成 → 还有什么没有验证**。这比截图堆积更容易转化成可复用知识。

## 07–12 · 把视觉方法迁移到不同业务

| 独立站点             | 视觉与布局施工要点                                                       | 必须实际完成的任务                                      | 检验重点                                             |
| -------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------- | ---------------------------------------------------- |
| restaurant / EMBER   | 酒红与奶油黄、戏剧性衬线标题、圆形餐盘 SVG、菜单网格、餐厅故事与预约段落 | 按菜品类别筛选、输入日期人数并获得本地预约确认          | 上海日期、周一闭店、人数边界；本地摘要不等于真实订位 |
| travel / ROAM        | 蓝与沙色、橙色行动按钮、山川插画、大块留白与目的地卡片                   | 筛选目的地、收藏、计算预算并导出 Markdown 草案          | 价格单位、预算公式、收藏存储、表单与文件一致         |
| fintech / MONO       | 暗色数据工作台、固定侧栏、紫色与薄荷色、图表旁提供文本与表格             | 切换周期、查找和关注资产、导出 CSV、调整复利假设        | 时间轴比例、汇总和表格一致、存储失败、0% 与负增长    |
| civic / OPEN CITY    | 居中搜索门户、蓝白层级、紧接首屏的服务目录                               | 查找服务、选择事项、完成本地预约摘要                    | 查询与分类交集、空态恢复、必填说明、时区与键盘焦点   |
| arcade / P1XEL       | 近黑底、荧光绿、像素角色、硬边操作区                                     | 游玩 REFLEX.EXE、保存与导出本地成绩；另三张卡是规则概念 | 抢跑不记分、后台取消回合、时钟和设备延迟、存储失败   |
| architecture / STILL | 全幅建筑 SVG、错位画廊、纸灰与材料色、细线和编号                         | 切换与筛选项目、阅读空间说明、导出本地项目简报          | SVG 实例 ID、场景类名、详情与表单焦点、纯空白拒绝    |

后六站与前六种视觉方法不是一一对应关系。例如餐厅可以借用 Editorial 的排版，但必须新增菜单和预约的状态设计；旅行网站可以使用 Swiss 的网格，但仍需解决预算单位与目的地比较。

### 餐厅预约的最小状态机

`未填写 → 输入中 → 校验失败 / 校验通过 → 本地确认 → 修改信息`。日期不得早于**餐厅营业地的当天**；当前 EMBER 使用 `Asia/Shanghai`，不依赖访客设备时区，且拒绝周一闭店日期。人数为 1–8。界面明示不会发送订位请求；成功面板重复展示日期、时间和人数，让用户有机会检查。

### 旅行预算的最小公式

`预算 =（目的地每日参考价 × 天数 + 每人交通参考价）× 人数`。所有金额标明币种和“参考估算”，不要把演示数据写成实时机票价格。变更目的地、人数或天数后，汇总立即更新；限制零、负数和不合理的上界。

### 新增第十三个站点

1. 在 `apps/<站点名>` 新建独立 `index.html` 与 `src`，不要导入另一个站点的页面壳。
2. 在根 Vite 站点清单、批量构建脚本和目录页登记入口。
3. 先确定独有任务与信息架构，再设计视觉，不要换色复制旧站。
4. 单独构建该站，验证其输出不依赖兄弟站点。
5. 更新来源、复刻文档与真实验证记录，再按仓库工作流程提交。

## 已实现站点的具体阅读路线

### MORI / organic

从 `apps/organic/src/main.tsx` 的商品数据开始，沿着“分类 → 商品详情 → 购物袋 → 数量与费用摘要”阅读。购物袋使用 `mori-bag` 本地存储键；金额规则为商品合计满 299 免运费，否则运费 18。以一件商品、刚好达到门槛和低于门槛三个输入检查汇总，比只观察按钮颜色更能理解交互。

视觉基线是米白 `#f5f2e9`、深绿 `#35482f` 与原创植物/器物 SVG。复制时先保留商品信息、价格、养护说明和购物袋数量的阅读顺序，再调装饰。当前没有实时库存状态。订阅只更新当前页面内的反馈，不保存邮箱、不发送邮件。

### GRID/26 / swiss

从 `apps/swiss/src/main.tsx` 的展览与日程数据入手，分别跟踪原生 `<dialog>` 详情、三天九场日程筛选，以及票种/人数/日期生成的本地预约摘要。原生对话框提供了基础焦点行为，但仍需校验可见关闭入口与手机滚动。

红黑米白排版与三张原创几何海报构成视觉识别。复刻时保持标题、日期、编号的对齐线；到窄屏先重排信息，不把整个桌面画布等比缩小。

### FOLIO / editorial：深梅紫与铜粉

FOLIO 的封面为左右双栏：左侧文章标题与导读，右侧原创空间 SVG。**当前站点已经采用深梅紫 `#322b38` 与铜粉 `#dfbaa8`，并非上文风格练习中的通用米白/朱红配方。** 这种变化让其与 MORI 的自然绿色形成明确差异。

下面摘录当前页面的关键规则，方便直接定位修改：

```css
/* apps/editorial/src/styles.css */
.hero-copy {
  background: #322b38;
  color: #f5eee4;
  padding: 40px 43px 35px;
  display: flex;
  flex-direction: column;
}
.hero h1 {
  font-family: 'Songti SC', 'Noto Serif CJK SC', Georgia, serif;
  font-size: clamp(44px, 4.4vw, 74px);
  line-height: 1.35;
  letter-spacing: 3px;
  font-weight: 500;
  margin: 39px 0 0;
}
.hero h1 span {
  color: #dfbaa8;
}
```

文章有“空间 / 物件 / 日常 / 已收藏”筛选；`folio-saved` 只保存文章 ID。阅读面板使用原生 `<dialog>`，正文和 SVG 均为本项目原创。跟踪 `bookmark()` 理解收藏状态，再跟踪 `article` 状态与 `showModal()` 的联动。修改颜色时同时检查封面标题、焦点轮廓和选中文字，而不是只改一块背景。

### MORI 与 GRID/26 的实际网格对比

```css
/* apps/organic/src/styles.css：宽屏商品列表 */
.product-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 36px 25px;
}
/* apps/swiss/src/styles.css：宽屏展览列表 */
.exhibition-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}
```

虽然宽屏都是三列，窄屏策略不同：MORI 商品卡片转为两列，便于同屏比较；GRID/26 海报转为单列，保留大标题与几何构图。不要为了组件复用把两者强行合成一个统一的卡片系统。

### EMBER / restaurant：先让营业规则与表单一致

源码入口：[React 与菜品数据](../apps/restaurant/src/main.tsx)、[样式](../apps/restaurant/src/styles.css)、[独立复刻手册](../apps/restaurant/README.md)。按 `dishes → category → reserve() → booking` 阅读，先完成六道菜的三类筛选，再完成“日期 / 时间 / 人数 → 本地摘要”的任务流。

`Plate()` 用圆形餐盘、径向渐变和六组食材轮廓形成主视觉，`useId()` 为每个 SVG 的渐变与滤镜生成独立标识。`Hearth()` 的拱形炉膛承担品牌故事插画。深酒红 `#511e28`、奶油 `#f3ead8` 与铜橙 `#edac76` 构成稳定层级；餐盘边缘和暖光比贴满食物照片更适合本项目的无外部素材条件。菜单桌面三列、680px 以下两列；故事图文在窄屏上下排列。

日期检查在 HTML 属性和 `reserve()` 中各有一层：`required / min` 提供即时浏览器反馈，提交函数再次检查 `localToday()` 和周一闭店规则。不要把 `toISOString().slice(0, 10)` 当作上海当天；这里使用指定时区的 `Intl.DateTimeFormat`。`booking` 只在页面内存在，既不创建餐厅订单，也不保留到刷新后。具体失败与修复见 [第三批审核](reviews/BATCH-03.md)。

### ROAM / travel：把场景、预算与导出连成一个任务

源码入口：[目的地与预算状态](../apps/travel/src/main.tsx)、[景观和布局样式](../apps/travel/src/styles.css)、[独立复刻手册](../apps/travel/README.md)。沿着 `destinations → visible → detail → planFor() → current / total → dayPlan() / downloadPlan()` 阅读；插画只是入口，真正完成任务的是目的地选择、预算解释和可下载草案。

`Scene()` 用背景、太阳、远景、近景、前景的绘制顺序生成 mountain / island / city 三种 SVG；六处目的地通过配色变量和内容区分。首屏左侧文字与大幅山景用渐变衔接，窄屏改成纵向渐隐。纸面 `#f7f6f0`、深蓝 `#183e4e`、按钮 `#b45b32` 是实际实现参数；目的地卡片随断点三列、两列、单列变化。

收藏由 `loadSaved()` 读取 `roam-saved`，仅保留已知 ID、去重并恢复异常输入；写入失败仍保留当前页面选择并提示。`people` 为 1–6，`days` 为 2–14，`total = (daily × days + transport) × people`。川西默认 5 天 2 人为 `¥6,600`；泉州 2 天 1 人为 `¥1,230`。`planFor()` 同时带入目的地并把键盘焦点交给规划器。草案首日为抵达、末日为返程，其余日期循环使用活动建议，不代表路线优化或时刻表验证。`downloadPlan()` 生成真正的 Markdown 文件，但没有预订、付款或实时报价。

### P1XEL / arcade：用状态机支撑街机视觉

源码入口：[游戏逻辑与成绩](../apps/arcade/src/main.tsx)、[像素与屏幕样式](../apps/arcade/src/styles.css)、[独立复刻手册](../apps/arcade/README.md)。先读 `phase`、`play()`、`reset()` 和 `visibilitychange` effect，再读 `scores → best / avg → download()`。四张游戏卡中只有 REFLEX.EXE 是可实际游玩的游戏，另三张明确为 CONCEPT 规则预览。

`PixelAlien()` 把 8×8 字符矩阵中的 `1` 画成 SVG 方格；`PixelStar()` 用可控阶梯轮廓代替系统 emoji。近黑 `#131019`、荧光绿 `#c5ff48`、紫色 `#a38df8` 与硬阴影建立街机识别。游戏库从桌面四列变为手机两列；反应屏幕仍保留足够大的操作面积，主体使用原生 button 支持点击、Enter 与空格。

核心阶段是 `idle → waiting → ready → result`；等待中点击进入 `early`，页面被标记为 hidden 时进入 `cancelled`，这两种情况均不记分。标准等待 1500–4000ms，耐心等待 2500–5500ms。`performance.now()` 差值记录为毫秒，包含浏览器和设备延迟，不能包装成标准化能力测量。`loadScores()` 逐项校验 `p1xel-scores`，最多保存 30 轮；`avg` 只取最近最多 5 轮。收藏 `savedGames` 则只在当前页面存在。JSON 导出是真实本地文件，不上传排行榜。

### MONO / fintech：让一个数据源驱动四种表达

源码入口：[序列、图表与状态](../apps/fintech/src/main.tsx)、[工作台样式](../apps/fintech/src/styles.css)、[独立复刻手册](../apps/fintech/README.md)。先读 `series` 与 `AssetChart()`，再读 `assets → filtered → updateWatchlist()`，最后读 `monthly / years / assumption → future`。这是一张有侧栏、工具条、表格和规划区的完整数据工作台，没有套用营销首页的“左文字右插画”结构。

图表有 1W、1M、3M、1Y 四组带 ISO 日期的预置序列。`point()` 将实际日期距离映射为 x 坐标，将金额范围映射为 y 坐标，不能把不等间隔的日期一律等距排布。`range` 同时决定 SVG、周期变化、表格与 CSV 导出；`comparison` 只控制模拟基准线显示。手机使用 380 宽 viewBox，桌面 760，保留可读刻度；表格是无需悬停即可核对的文字等价信息。底色 `#111214`、面板 `#191a1e`、薄荷 `#b5e9ce`、紫色 `#b3a0ef` 区分信息层级。

资产查询与类别取交集，关注用 `mono-watchlist` 保存已知 symbol 并去重。缺键首次预设两项；主动清空必须写入 `[]`，否则刷新会重新套用首次默认值。写入失败应说明仅当前页有效。月末投入终值为 `monthly × ((1 + r)^(years × 12) − 1) / r`，其中 `r = assumption / 100 / 12`；0% 分支直接累加，负增长允许结果低于累计投入。默认 500/月、10 年、4% 为约 `$73,625`。参数标记仅当前页面，所有金融样本均为虚构，不连接账户或交易。

### OPEN CITY / civic：以搜索和办事顺序组织门户

源码入口：[服务、查询与表单](../apps/civic/src/main.tsx)、[门户样式](../apps/civic/src/styles.css)、[独立复刻手册](../apps/civic/README.md)。跟踪 `services / categories → query / category → filtered → pickService() → submitBooking() → confirmation`。居中搜索后立即出现六项服务；城市动态放在目录之后，避免宣传图抢走主要任务入口。

实际用色为操作蓝 `#2149e8`、正文 `#162642`，门户背景由 `#edf3ff` 向白色过渡。搜索宽度上限 760px；服务桌面三列、760px 以下两列、360px 以下一列，手机表单单列。社区卡片用树木椭圆、纸张旋转和重叠圆形组成轻量 CSS 图形；这些图形不是机构徽标或真实活动照片。

搜索提交通过 `showResults()` 聚焦目录，清除回搜索框，无结果重置回目录；选择服务通过 `pickService()` 预选并聚焦表单。`cityToday()` 用上海时区 `formatToParts()` 生成日期，不受访客设备时区影响。原生必填/邮箱/date 校验之外，提交函数还检查空白称呼、演示确认、日期与允许时段；错误与成功都有明确焦点。`confirmation` 仅页面内存，示例邮箱不写入摘要或存储，不向公共机构提交。

### STILL / architecture：把大画幅与内容路径一起复刻

源码入口：[项目、SVG 与简报](../apps/architecture/src/main.tsx)、[画廊样式](../apps/architecture/src/styles.css)、[独立复刻手册](../apps/architecture/README.md)。从 `projects → ArchitectureScene()` 理解四种场景，再跟踪 `hero` 首屏循环、`filter` 类别、`project` 详情与 `downloadBrief()`。项目均为原创虚构概念，面积和材料是叙事设定，不代表建成作品或工程建议。

`ArchitectureScene()` 使用 1600×900 viewBox，以屋面、侧墙、正立面建立透视，再依次加入玻璃、窗框、水面、树木与人物尺度；四场景为 courtyard / gallery / coast / pavilion。React `useId()` 避免同页多幅插画的渐变/滤镜冲突。`preserveAspectRatio="xMidYMid slice"` 让图形铺满画幅；手机裁切需要单独检查建筑主体。纸面 `#eeede8`、正文 `#262721` 与低饱和材料色形成安静气质。画廊桌面不等宽、偶数项错位，480px 以下改单列。

外层 `.project-gallery` 只承担网格；单项目的场景类使用 `project-scene-*`，避免 gallery 场景意外继承外层布局。详情窗口锁定背景、循环焦点，进入简报时把焦点交给项目方向。地点和想法经过 trim 校验，纯空白不可下载；想法去除首尾空白后至少 8 个字符。真正导出的 Markdown 包含所选方向、面积、地点、想法与演示说明；数据不发送，也不保存到浏览器存储。

## 当前实现的持久化与服务边界

以下依据十二站当前源码整理，不能从“所有样例都在同一仓库”推断它们具有相同的数据生命周期。

| 站点      | 页面内状态                                          | 刷新后保留的内容                                                                  | 实际外部动作                                      |
| --------- | --------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------- |
| FOLIO     | 分类、当前文章、订阅成功反馈                        | `folio-saved` 文章 ID；`folio-newsletter-demo` 邮箱意向（页面不自动恢复成功状态） | 无邮件发送、无账户同步                            |
| GRID / 26 | 日程日期、票种、人数、本地预约摘要                  | 无                                                                                | 无真实预约、付款或库存查询                        |
| MORI      | 商品筛选/详情、摘要、订阅反馈                       | `mori-bag` 商品 ID 与数量                                                         | 无订单创建、付款、发货或邮件发送                  |
| AURA      | 曲目、播放、音量、收藏、计时                        | 无；收藏是会话级                                                                  | 用户点击后通过 Web Audio 在浏览器中合成声音       |
| TRACE     | 有限命令日志、代码标签、计费开关、方案弹窗          | 无                                                                                | 可复制文本；不执行 shell、不部署、不收费          |
| ODD       | 作品筛选/详情、项目简报字段                         | 不写本地存储；用户另存的下载文件不受页面刷新影响                                  | 生成并下载本地 Markdown；不会发送给工作室         |
| OPEN CITY | 查询、服务选择、当前预约摘要                        | 无                                                                                | 不提交给机构、不写本地存储                        |
| EMBER     | 菜单分类、人数、日期、时间、本地预约意向            | 无                                                                                | 不向餐厅发送请求，不产生真实订位                  |
| ROAM      | 类别、详情、目的地、人数、天数、行程草案            | `roam-saved` 目的地 ID                                                            | 下载本地 Markdown；不查询实时报价，不预订或付款   |
| P1XEL     | 游戏阶段、模式、当前结果、概念卡收藏                | `p1xel-scores` 最近最多 30 条成绩                                                 | 下载本地 JSON；不上传排行榜、不连接游戏服务       |
| MONO      | 周期、比较线、搜索/类别、排序、复利参数与标记、通知 | `mono-watchlist` 已知资产代码                                                     | 下载本地 CSV；不连接账户、实时行情或交易          |
| STILL     | 当前首屏项目、筛选、详情、项目简报字段与下载反馈    | 无                                                                                | 下载本地 Markdown；不发送给建筑事务所，无施工能力 |

实际源码与每站 README、页面说明应保持一致。建议见 [设计系统的状态约定](DESIGN-SYSTEM.md)，已执行结果见对应批次复盘；上表记录数据范围，不代替浏览器验收证据。
