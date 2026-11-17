# 第二批反刍审核：ODD / AURA / TRACE

审核日期：2026-11-17（新加坡）。本批仅审核第二组三个独立站点；审核完成后才开始第三批。

## 范围与结论

| 站点 | 视觉语言 | 完整页面结构 | 结果 |
| --- | --- | --- | --- |
| `apps/brutalist` / ODD | 荧光黄、奶白、黑色；硬边框；巨型排版与原创海报 | 导航、宣言、作品筛选与详情、工作室介绍、服务折叠、流程、本地简报表单、页脚 | 通过本批检查 |
| `apps/glass` / AURA | 深紫渐变、玻璃透明层、柔和三维 CSS 形体 | 导航、真实声音播放器、声音库、理念、日常仪式、FAQ、页脚 | 通过本批检查 |
| `apps/terminal` / TRACE | 深绿网格、等宽字体、状态色、终端工作区 | 导航、命令演示、功能、配置、原则、交互定价、FAQ、页脚 | 通过本批检查 |

三站均有自己的 HTML、React 入口和 CSS，可以单独构建。没有 iframe 或共享展示外壳。

## 反刍发现及修复

1. **AURA 移动端悬浮装饰靠近播放器操作区。** 将装饰设置为不接收指针事件，移动端隐藏右下装饰，避免遮挡音量与演示说明。保留桌面构图与移动端主要视觉。
2. **AURA / TRACE 的若干功能性次级文案过小、偏暗。** 将正文、FAQ、方案功能与命令日志增大，并提高文字颜色亮度。TRACE 手机端功能卡和价格卡改为更宽裕的单列组织，避免用小字号维持桌面密度。
3. **AURA / TRACE 缺少跳过导航入口。** 增加键盘可见的“跳到主要内容”链接；通过 Tab 验证。
4. **TRACE 配置窗口展示了快捷键提示，但没有实现对应行为。** 增加 Ctrl/Cmd + 1/2 切换终端与配置，避免装饰性的假快捷键。
5. **TRACE 方案弹窗缺少可访问名称。** 增加标题关联；验证原生模态对话框及 Escape 关闭。
6. **脚本触发平滑滚动未尊重系统减少动态设置。** AURA / TRACE 的滚动操作改为检查 `prefers-reduced-motion`。
7. **ODD 的表单占位符与流程说明可以更清晰。** 提高占位符及流程正文对比度；增大移动端介绍正文与筛选按钮触控尺寸。

## 实际执行的验证

- `npm run typecheck`：通过。
- 三个站点分别执行 `npm run build -- --mode <site>`：通过。
- Chromium / Playwright 执行 **39 个可失败的断言，全部通过**，明细：[`../../artifacts/reviews/batch02-results.json`](../../artifacts/reviews/batch02-results.json)。
- 桌面 `1440 × 1000` 与移动端 `390 × 844` 全页截图逐站审阅；三站均无页面横向溢出、无浏览器运行时错误。
- ODD：类别筛选、Enter 打开项目、Escape 关闭、键盘展开服务、简报下载；读回下载文件并确认服务、预算和输入内容一致。
- AURA：键盘播放/暂停、音量变化、切曲、收藏筛选与空状态、启动/取消专注计时。声音由浏览器 Web Audio 实时合成；未将其宣称为录制音乐。验证音频状态与实际 API 调用，未做扬声器听感评估，也未等待完整 25 分钟。
- TRACE：质量检查模拟、clear/help 命令、Ctrl+1/2、键盘切换年付、年付金额、带可访问名称的方案弹窗及 Escape。所有构建/测试/部署输出继续明确标为模拟数据。
- 三站：手机导航开关与点击后关闭、键盘跳过链接、系统减少动态设置。

## 对比度抽检

对七组实际计算样式取色，并按 WCAG 相对亮度公式计算；覆盖主要说明正文、FAQ、命令日志和方案功能。背景按对应区域实色基底取值，未对透明渐变逐像素测量。

| 样本 | 比值 |
| --- | --- |
| AURA 声音说明 / FAQ | 8.06 : 1 |
| TRACE 功能说明 | 8.69 : 1 |
| TRACE 命令日志 | 9.00 : 1 |
| TRACE 方案功能 | 8.50 : 1 |
| ODD 流程正文 | 6.26 : 1 |
| ODD 工作室介绍 | 9.53 : 1 |

明细：[`../../artifacts/reviews/batch02-contrast.json`](../../artifacts/reviews/batch02-contrast.json)。这是有针对性的抽检，不等同于完整 WCAG 合规认证；装饰性微型标签仍保留视觉层级。

## 截图证据

- `artifacts/reviews/batch02-brutalist-desktop.png`
- `artifacts/reviews/batch02-brutalist-mobile.png`
- `artifacts/reviews/batch02-glass-desktop.png`
- `artifacts/reviews/batch02-glass-mobile.png`
- `artifacts/reviews/batch02-terminal-desktop.png`
- `artifacts/reviews/batch02-terminal-mobile.png`

## 用于下一批的规则

- 主视觉可以夸张，功能说明和操作目标必须易读、可点、可键盘操作。
- 装饰层不得遮挡真实控件；手机端应重组信息，不能只缩小字号。
- 每个承诺互动的按钮都需要真实行为或清楚的演示边界。
- 完整站点独立运行。每完成三套，先做截图、行为与复盘，再进入下一组。
