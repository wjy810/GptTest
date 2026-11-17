# ODD — 粗野主义创意工作室复刻手册

ODD 是一个完整、独立的虚构创意工作室网站。视觉由巨型文字、粗边框、荧光黄、错位海报和清晰的作品叙事组成。
它不嵌在目录页里；自己的 HTML、React 入口、CSS、导航和页脚都位于本目录。

## 1. 启动、构建与独立部署

从仓库根 `/workspace/GptTest` 执行：

```bash
npm ci
npm run dev -- --mode brutalist
npm run build -- --mode brutalist
```

开发命令会持续运行；构建时另开一个终端，或先按 Ctrl+C 停止开发服务。

开发服务器由根 `vite.config.ts` 选择本目录，默认端口是 **5175**；端口占用会报错，不会悄悄切换。
构建目录为 `dist/brutalist/`，其内容可以整体上传到任意静态站点托管服务。
`base: './'` 让构建后的资源使用相对地址，既可放独立域名根目录，也可放完整子目录。

```bash
# 单独预览这一套构建，不需要启动目录站。
python -m http.server 4175 --directory dist/brutalist --bind 0.0.0.0
# 仓库级类型检查。
npm run typecheck
```

没有服务端、账户、数据库或外部图片 API；首次安装依赖需要访问 npm。

## 2. 页面结构与源码定位

| 区域         | 源码定位                                         | 作用                                                |
| ------------ | ------------------------------------------------ | --------------------------------------------------- |
| 首屏         | `src/main.tsx` 的 `App`；CSS `.hero`、`.hero h1` | 用 `GOOD IS / BORING.` 建立主视觉，红线圈出情绪重点 |
| 作品         | `works` 数组、`Poster`、`.work-grid`             | 四个不同品牌世界；分类筛选后仍保留统一的信息层级    |
| 作品详情     | `project`、`dialog`、`.project-dialog`           | 展示问题、方法与产出；使用原生模态对话框            |
| 工作室与服务 | `.about`、`.services`                            | 原生 `details/summary` 展开服务说明                 |
| 方法         | `.process`                                       | Question → Explore → Make 三阶段叙事                |
| 项目简报     | `download()`、`.contact`                         | 根据服务、预算与正文生成本地 Markdown 文件          |

## 3. 先还原这些视觉参数

| 参数                | 当前实现                                                                          |
| ------------------- | --------------------------------------------------------------------------------- |
| 背景 / 正文         | `#f3f2e9` / `#171713`                                                             |
| 荧光强调 / 红色笔触 | `#edff3b` / `#fa5238`                                                             |
| 字体                | Arial、Noto Sans CJK SC、系统 sans-serif；不在线下载字体                          |
| 首屏标题            | `clamp(100px, 15.3vw, 245px)`，字重 950，行高 `.83`，字距 `-.075em`               |
| 边框                | 主要分隔与控件采用约 2px 实线，保留硬边与直接反馈                                 |
| 作品网格            | `1.1fr 1fr`，列间距 34px、行间距 50px；移动端单列                                 |
| 海报高度            | 基础 490px；1100px 断点收至 420px；650px 下作品列表为 340px（详情海报仍为 360px） |
| 桌面整体上限        | `main, header, footer` 最大宽度 1650px                                            |

先保证大字和内容网格成立，再添加贴纸；不要靠随机旋转所有元素制造“粗野”。

## 4. 图形如何搭出来

1. `Star()` 在 `100 × 100` SVG 中画 8 条矩形，每条绕 `(50,50)` 旋转 `22.5°`；形成可缩放的黑色放射贴纸。
2. `.scribble` 是一个无填充 SVG path，描边 5px、旋转 `-4deg`，绝对定位到标题下部；`pointer-events: none` 保证不遮挡操作。
3. `Poster({ theme })` 根据 `signal/type/milk/objects` 切换图形内容，不切换页面外壳。
4. `signal` 使用 18 根柱条，条高来自 `35 + Math.sin(i * .7) * 26`；整体旋转 `-15deg`，配合紫色大字形成信号海报。
5. `type` 使用 Georgia 的 `Aa`，大字号、负字距与 `-10deg` 旋转；黄色底色提供高对比。
6. `milk` 的纸盒由矩形、边框、阴影与旋转组成；`.carton` 基础尺寸为 `150 × 260px`，不是外部产品图片。
7. `objects` 的球体使用径向渐变；圆环是粗边框椭圆；长条用线性渐变。背景是 35px 网格。
8. 悬停只增强操作提示；项目标题按钮提供第二个详情入口，内容不依赖悬停才能访问。

重新制作时先复刻一个静态 `Poster`，再将主题放进数据数组，最后处理移动端缩放。

## 5. 状态与交互还原

- `filter` 初始为“全部”，通过 `works.filter(...)` 派生列表；筛选按钮用 `aria-pressed` 标记选中状态。
- `project` 为项目对象或 `null`；effect 调用 `showModal()` / `close()`，详情标题使用 `aria-labelledby="project-title"`。
- Esc、关闭按钮、点击遮罩都将 `project` 设为 `null`；原生 dialog 提供模态焦点约束。
- `menu` 控制移动导航，选择锚点后关闭；`aria-expanded` 与可见状态一致。
- `service`、`budget`、`brief` 是表单受控状态；正文 `required`，长度 5–2000 字符。
- `download()` 将输入写入 `Blob`，创建对象 URL 并下载 `odd-project-brief.md`，随后释放 URL。
- `downloaded` 控制反馈文本；任何字段修改都会将它重置，避免旧成功状态误导用户。

核心导出逻辑可以按以下顺序复刻：

```text
有效表单提交 → 读取三个字段 → 拼接 Markdown → Blob
→ createObjectURL → 带 download 的 a 元素触发下载
→ revokeObjectURL → 显示“已生成并下载”反馈
```

简报只留在使用者浏览器中；不要将此动作改写成“已发送给工作室”。

## 6. 移动端与可访问性

- 主要断点为 1100px 与 650px；650px 下作品单列、导航切换为可展开菜单。
- 作品标题在手机端占满当前内容宽度，计数 `(04)` 放在第二行右侧：`right: 0; top: auto; bottom: 6px`。保留计数和 56px 标题；不要用全站 `overflow-x: hidden` 掩盖计数越界。
- 手机作品海报高 340px、网格行距 28px，标题按钮最小高度 44px。局部缩放字形/纸盒、上移几何物件，适配收短后的海报，而不是裁掉操作入口。
- 手机预算选择与简报输入为 16px，服务选择按钮至少 44px 高。核对文件末尾的小屏修正规则，最终计算样式以靠后的匹配声明为准。
- `skip` 链接可直接跳到作品；图形使用 `aria-hidden`，按钮保留可理解的名称。
- 保留可见焦点；用 Enter 打开项目，Tab 在弹窗内移动，再用 Esc 关闭并检查焦点返回。
- `prefers-reduced-motion: reduce` 关闭平滑滚动与装饰过渡；信息和操作仍完整。

## 7. 五步验收

1. 1440px、390px 与 320px 宽度分别检查首屏和海报，页面不应横向溢出，文字不被图形盖住。
2. 点击“数字体验”，只显示 `OFF TYPE`；点击“全部”恢复四项。
3. 打开 `NO SIGNAL`，核对问题、方法、产出；分别用 Esc 和关闭按钮退出。
4. 展开服务说明，切换预算，正文少于 5 字符时提交应被表单校验阻止。
5. 输入有效简报并下载，打开 Markdown 核对服务、预算、正文与“未发送”说明完全一致。

### 本轮针对性优化的实际记录

本轮仅调整小屏 CSS；首屏结构和所有交互保持原实现。已实际通过独立构建、仓库 TypeScript 检查、已有 ODD 的 5 项 Playwright 测试（含筛选、详情与简报下载内容），以及 [三个尺寸的布局实测脚本](../../artifacts/optimization/verify-brutalist.mjs)。

| 实测项               | 优化前 → 优化后                                               |
| -------------------- | ------------------------------------------------------------- |
| 320px 页面宽度       | `329px → 320px`；计数右边界 `328.89px → 300.81px`，计数仍可见 |
| 手机作品海报高度     | `390px → 340px`，缩短约 12.8%                                 |
| 手机作品标题按钮高度 | `26px → 44px`                                                 |
| 手机预算 / 简报字号  | `13px / 14px → 16px / 16px`                                   |
| 390px 联系区起点     | `4249.31px → 4061.31px`，更早 188px                           |
| 1440px 整页高度      | `4506px → 4506px`，桌面截图像素保持一致                       |

[优化前测量](../../artifacts/optimization/brutalist-before-metrics.json) / [优化后测量](../../artifacts/optimization/brutalist-after-metrics.json)；截图：[320px 前](../../artifacts/optimization/brutalist-320-before.png) / [后](../../artifacts/optimization/brutalist-320-after.png)、[390px 前](../../artifacts/optimization/brutalist-390-before.png) / [后](../../artifacts/optimization/brutalist-390-after.png)、[1440px 前](../../artifacts/optimization/brutalist-1440-before.png) / [后](../../artifacts/optimization/brutalist-1440-after.png)。

复验时先运行 `npm run build -- --mode brutalist` 与根预览服务，再执行 `node artifacts/optimization/verify-brutalist.mjs`。此脚本只针对本轮布局范围；下载流程由 `npx playwright test --grep brutalist` 的既有用例验证。

## 8. 研究依据与边界

- [Codrops OnScrollTypographyAnimations](https://github.com/codrops/OnScrollTypographyAnimations)：已读源码中的巨型文字、行高和字符组织方法；本页没有使用其滚动动画或宣称逐像素复刻。
- [Radix Dialog 文档](https://github.com/radix-ui/website/blob/main/data/primitives/docs/components/dialog.mdx)：已读模态标题、Esc 与焦点管理规范；本站实际使用浏览器原生 `dialog`，并未安装 Radix。
- [React Aria](https://github.com/adobe/react-spectrum)：已读行为、状态与外观分离的定位；对应本站数据驱动作品和独立交互状态。
- 完整核验范围、B 站等受阻平台与后续取证流程见 [研究来源](../../docs/SOURCES.md)。

ODD、作品名称和客户情境是原创虚构内容；此实现用于学习风格与交互，不代表真实工作室、项目或已开展的业务。
