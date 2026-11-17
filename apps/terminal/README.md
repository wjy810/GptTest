# TRACE — 终端风格开发工具复刻手册

TRACE 是独立的开发者产品展示站。它把深绿黑底、等宽文字、编辑器结构与明确的状态反馈组成一套完整网站。
终端具有可用的本地命令解释流程，但不执行系统命令、不部署项目，也不连接真实开发服务。

## 1. 启动、构建与独立部署

从仓库根 `/workspace/GptTest` 执行：

```bash
npm ci
npm run dev -- --mode terminal
npm run build -- --mode terminal
```

开发命令会持续运行；构建时另开一个终端，或先按 Ctrl+C 停止开发服务。

默认开发端口为 **5178**；根 `vite.config.ts` 将入口切换到 `apps/terminal/index.html`。
构建得到 `dist/terminal/`，直接部署该目录即可，不依赖目录页、其他站点进程或服务端。
资源使用相对 `base: './'`，保持构建目录内部文件结构即可部署到独立域名或子目录。

```bash
python -m http.server 4178 --directory dist/terminal --bind 0.0.0.0
npm run typecheck
```

不要尝试安装页面里的 `trace` 命令；这是虚构产品的交互样例，不是 npm CLI 安装说明。

## 2. 页面结构和源码定位

| 区域         | 定位                                                 | 交互目标                                     |
| ------------ | ---------------------------------------------------- | -------------------------------------------- |
| 首屏工作空间 | `.workspace`、`.workspace-sidebar`、`.terminal-area` | 左侧导航、编辑器标签、命令输入与实时追加日志 |
| 功能         | `.feature-grid`、`.pipeline`、`.status-viz`          | 用流程和状态展示工具信息层级                 |
| 工作流       | `snippets`、`.code-window`                           | 在配置与 workflow 示例之间切换               |
| 设计宣言     | `.manifesto`                                         | 拉开高密度工具区与商业说明区的节奏           |
| 定价         | `annual`、`.pricing-grid`                            | 月付/年付切换及方案预览                      |
| FAQ / 结束段 | `.faq-list`、`copyCommand()`                         | 说明演示边界，提供可复制的本地演示命令       |

## 3. 视觉参数和层级

| 参数            | 实际实现                                                            |
| --------------- | ------------------------------------------------------------------- |
| 背景 / 主文字   | `#0c100e` / `#e1e7e2`                                               |
| 成功强调        | `--green: #a1e0aa`                                                  |
| 次级信息 / 表面 | `--muted: #78837b` / `--surface: #111713`                           |
| 边框基线        | `--border: #ffffff12`；重要容器使用略亮绿边框                       |
| 字体            | SFMono-Regular、Consolas、Liberation Mono、中文系统字体、monospace  |
| 内容宽度        | `.shell` 最大 1180px，桌面宽度 `calc(100% - 112px)`                 |
| 首屏标题        | `.hero-heading h1` 使用 Arial，基础 85px、行高 1.04、字距 -5px      |
| 编辑器布局      | `.workspace-body` 基础 `208px 1fr`，终端区 `min-width: 0`           |
| 工作空间外框    | 8px 圆角、细边框、低强度阴影；避免厚重拟物窗口                      |
| 命令输入        | `16px / 24px`，输入与提交按钮至少 `44px` 高；命令行容器至少 `54px`  |
| 日志文字        | `12px / 1.85`，每行有 `22px` 悬挂缩进，换行与输出文字对齐           |
| 集成边界说明    | `.compatibility > p` 为 `12px / 1.8`、`#a2b9a9`，不作为装饰微字处理 |
| 首屏中文正文    | `.hero-description > p` 为 `14px / 1.9`、`#b0c0b5`                  |

视觉的关键是“信息密度有层次”，不是将所有文字缩小。最终工作区规则位于 CSS 末尾 `Readable working surfaces` 注释之后，需读取完整级联结果。

## 4. 编辑器与装饰图形拆解

1. `.grid-backdrop` 将两层 1px 线性渐变叠加为 56px 网格，再用 mask 向下淡出。
2. `.workspace-title` 放置三个窗口圆点、项目名与分支信息，建立熟悉的桌面工具模型。
3. 左侧 `.workspace-sidebar` 和右侧 `.terminal-area` 用 CSS Grid 分栏；编辑器内部再用纵向 flex 固定标签栏和状态栏。
4. `.terminal-content` 单独滚动，不能让长日志撑破整个页面；`log.current.scrollTo` 在追加内容后滚到底部。
   输出区桌面高 `310px`，760px 以下高 `340px`；360px 以下高 `430px`，让窄屏的初始多行日志与演示标记完整呈现。
5. `.terminal-lines` 按首字符识别成功 `✓` 与信息 `→`，颜色以外仍保留符号和文本。
6. `.pipeline` 用 DOM 图标与连接线表达 Write → Check → Ship，不依赖图片加载。
7. `.status-viz` 同时显示颜色、名称与 Healthy/Building/Idle，不能只凭绿黄灰判断状态。
8. `.cursor` 是 `1.2s steps(2,end)` 的闪烁下划线；减少动态效果时关闭动画。

输入区采用细绿边框与轻背景，与只读输出形成区别；`:focus-within` 提亮整行。输入提示缩为“输入 help 查看命令”，完整命令列表由已有 `help` 给出，避免手机依赖一条被截断的长占位符。
日志使用 `overflow-wrap:anywhere` 处理未知长命令，`padding-left:22px` 配合 `text-indent:-22px` 保留状态符号列；换行留在输出区内，不扩大页面宽度。

## 5. 本地命令状态机

`commands` 只包含 `deploy`、`check`、`status` 三组固定样例输出。
`activeCommand` 决定标题命令，`lines` 决定已显示行，`running` 控制输入和快捷动作是否可用。

```text
runCommand(key)
→ 清理旧 timers
→ 选择 terminal 标签、清空输出、设置 running
→ 220ms 后第一行，每隔 280ms 追加下一行
→ 最后一行追加时设置 running=false
```

- `timers` 使用 ref 保存超时句柄，重复执行前和组件卸载时都会清理，避免两次输出交错。
- `submitCommand(event)` 去除空白、转小写、移除可选 `trace ` 前缀，并读取第一个单词。
- `deploy/check/status` 进入样例执行；`clear` 清空；`help` 展示帮助；未知命令返回可恢复提示。
- 输入不会传给 shell、`eval` 或服务器；即使输入真实系统命令，也只会得到本地文本反馈。
- `editorTab` 负责 terminal/config，键盘 Ctrl 或 Command + 1/2 可切换。
- `snippet` 只控制下方代码窗口的 config/workflow，不影响正在执行的演示终端。
- 日志区域是 `role="log"` 与 `aria-live="polite"`，用于播报新增反馈。

## 6. 定价、复制、焦点与弹窗

- `annual` 控制价格：Pro 月付 20、年付折算 16；Team 月付 40、年付折算 32，Hobby 为 0。
- 年付界面同时显示每人全年合计，避免只显示折算月价而遗漏计费周期。
- 切换按钮使用 `role="switch"` 与 `aria-checked`；方案按钮设置 `plan`。
- `plan` effect 打开原生 `dialog`；`aria-labelledby="plan-title"` 提供标题，Esc/关闭/遮罩均能退出。
- `copyCommand()` 尝试 Clipboard API；失败时显示只读输入框，聚焦自动选中文字，允许手动复制。
- `focusDemo()` 滚动至终端并聚焦命令输入，显式检查 `prefers-reduced-motion`。
- FAQ 的 `faq` 状态同步展开按钮与答案；移动菜单由 `menu` 独立管理。

复制成功只表示示例文本进入剪贴板，不表示系统已安装、执行或部署。

## 7. 响应式与可访问性

主要断点是 1050、760、440px；440px 下隐藏侧边栏，顶部标签和命令输入仍可用；360px 以下给日志更多高度，并允许首屏操作换行。
小屏定价卡片最终覆盖为单列；状态表与终端日志保留文字大小修正规则。
保留 `min-width: 0`、日志换行和溢出处理，避免长命令导致页面横向滚动。
用键盘走通导航、终端、价格开关、弹窗与复制兜底；装饰动画关闭后功能不能缺失。
手机命令输入和占位符实际字号都为 16px，顶部编辑器标签至少 44px 高；这里只报告 Chromium 的计算样式与流程检查，不声称 iOS 真机验证。

## 8. 五步验收

1. 输入 `help`、`trace status` 和未知命令，分别得到帮助、逐行状态与可恢复错误；输入 `clear` 后清空输出。
2. 连续尝试执行期间的快捷动作，确认禁用态生效；结束后可以再运行，无混合旧日志。
3. 使用编辑器标签和 Ctrl/Command + 1/2 切换内容；下方 workflow 标签显示 YAML，而非重复配置内容。
4. 年付开关打开后 Pro 为 16、Team 为 32；打开方案弹窗，确认名称与计费方式一致，Esc 关闭后可继续操作。
5. 390px 宽度下执行命令、打开菜单与 FAQ；测试复制成功和权限拒绝后的手动复制路径，检查无横向溢出。

本轮针对性优化可用 `node artifacts/optimization/terminal-verify.mjs` 复跑（先构建并启动 `npm run preview`，脚本使用 `/usr/bin/chromium`）。基线与优化后 1440/390/320 截图为 `artifacts/optimization/terminal-*-before.png` / `terminal-*-after.png`，字号与流程结果为 `terminal-before.json` / `terminal-results.json`。脚本覆盖本轮输入、命令、快捷键与计费关键流程；不替代上述完整手动验收。

## 9. 研究依据与演示边界

- [IBM Carbon](https://github.com/carbon-design-system/carbon)：已读 grid、layout、colors、motion 等包的职责，用于理解高密度界面的层级与一致性。
- [cmdk](https://github.com/pacocoursey/cmdk)：已读命令命名、过滤、空态与加载态；本站实现的是有限命令解释器，没有安装 cmdk。
- [Radix Dialog 文档](https://github.com/radix-ui/website/blob/main/data/primitives/docs/components/dialog.mdx)：已读模态焦点与关闭行为；本站使用原生 dialog。
- 核验范围、证据与后续视频研究见 [研究来源](../../docs/SOURCES.md)。

构建耗时、质量分数、测试数量、部署区域和定价都是标注过的样例数据，不是本仓库真实测试结果或商业承诺。
