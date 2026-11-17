# AURA — 玻璃质感声音产品复刻手册

AURA 是独立的声音体验网站：深色空间、低饱和光晕、玻璃播放器与柔和几何物体构成完整视觉语言。
播放按钮确实生成声音，但声音由浏览器合成；它不是只会切换图标的假播放器，也不是在线音乐服务。

## 1. 启动、构建与独立部署

从仓库根 `/workspace/GptTest` 执行：

```bash
npm ci
npm run dev -- --mode glass
npm run build -- --mode glass
```

开发命令会持续运行；构建时另开一个终端，或先按 Ctrl+C 停止开发服务。

开发端口为 **5177**，根 `vite.config.ts` 将 Vite root 定位到 `apps/glass`。
最终发布目录是 `dist/glass/`；只部署该目录即可，目录页和其他样例不是运行依赖。
资源路径使用 `base: './'`，可部署到独立域名或保持目录结构的子路径。

```bash
python -m http.server 4177 --directory dist/glass --bind 0.0.0.0
npm run typecheck
```

音频无需服务器或下载音乐文件。浏览器必须支持 Web Audio，并在用户主动点击之后启动声音。

## 2. 页面构成与入口

| 区域         | 源码位置 / 选择器               | 目标                                         |
| ------------ | ------------------------------- | -------------------------------------------- |
| 首屏         | `App`、`.hero`、`.hero-copy`    | 标题与播放器并列，先解释使用场景再给即时播放 |
| 播放器       | `.player-scene`、`.player-card` | 当前声音、收藏、播放状态、计时、换曲与音量   |
| 声音库       | `tracks` 数组、`.sound-grid`    | 四种音色，按心情或收藏筛选                   |
| 品牌理念     | `.philosophy`                   | 用留白、双球体与短文解释产品情绪             |
| 日常仪式     | `.ritual-grid`、`.timer-status` | 晨间播放、25 分钟专注与 10 分钟休息          |
| 问答与结束段 | `.faq-list`、`.closing`         | 解释音频性质、收藏范围和计时限制             |

## 3. 视觉令牌和比例

| 参数              | 当前实现                                                        |
| ----------------- | --------------------------------------------------------------- |
| 背景 / 主文字     | `#10101e` / `#f4f0ff`                                           |
| 次要文字 / 主强调 | `--muted: #9a97ac` / `--lavender: #cbc1ff`                      |
| 细边框            | `--line: rgba(230,220,255,.12)`                                 |
| 内容宽度          | `.shell` 最大 1240px，桌面宽度 `calc(100% - 112px)`             |
| 首屏标题          | 基础 94px、字重 500、行高 1.06、字距 -5.8px；大屏及小屏分别覆盖 |
| 玻璃卡片          | 最大 350px、圆角 24px、1px 半透明边框、24px 背景模糊            |
| 卡片背景          | `linear-gradient(135deg, #ffffff13, #ffffff05)`                 |
| 环境光            | `.ambient` 使用 100px blur，紫色与蓝色光源分布于画面两侧        |

字体声明优先 DM Sans / Manrope，但项目不下载这些字体；未安装时使用系统 sans-serif 回退。
先校准回退字体的行宽，再决定是否引入有许可的本地字体文件。

## 4. 玻璃与“空间物体”拆解

1. `.aura-site` 建立独立页面背景；`.ambient-one`、`.ambient-two` 是不可点击的模糊圆形光源。
2. `.scene-orbit` 用低透明度椭圆边框建立空间轨迹，放在卡片后方，避免与文字竞争。
3. `.player-card` 同时使用半透明渐变、边框、内高光和外阴影；只有 blur 不能表达玻璃厚度。
4. `.record` 是 170px 圆形，径向渐变从高光到暗部；`.record-inner` 与多个 `i` 叠加同心线。
5. `.record-playing` 添加 `record-spin 16s linear infinite`；暂停时类名移除，声音与视觉状态同步。
6. 波形由 39 根柱条构成，高度为 `10 + abs(sin(i * .68)) * 23`；它是装饰性动态，不是实时频谱分析。
7. `.bar-active` 使用 `.85s` 交替动画，每根延迟 `i * -.08s`，形成错峰节奏。
8. 四张音色图分别是球体、不规则水滴、圆角方块与倾斜椭球，主要使用 radial/conic-gradient、border-radius 和 inset shadow。

复刻顺序应是：纯色卡片 → 边框与阴影 → 背后光源 → 玻璃模糊 → 静态唱片 → 播放态动效。

## 5. 音频状态与资源管理

`src/main.tsx` 的 `App` 将可见状态与音频资源分开：

- `track` 是 `tracks` 的索引；`current` 由索引派生，不重复维护曲目信息。
- `playing` 控制播放按钮、状态文本、唱片旋转和波形动画。
- `volume` 初始 24；`context`、`gain`、`voices` 使用 ref 保存浏览器音频对象。
- `startSound(index)` 创建或恢复 `AudioContext`，先停旧音，再建立总线 GainNode。
- 三个正弦波频率为基础频率乘以 `1 / 1.5 / 2`，每层音量为 `1 / (i + 1)`。
- 总音量缩放为 `volume / 100 * .12`；音量变更用 `setTargetAtTime(..., .15)` 平滑过渡。
- `stopSound()` 停止全部振荡器并清空引用；卸载时停止音源并关闭 context。
- `togglePlay()` 切换播放；`selectTrack(index)` 更新曲目并将 `elapsed` 清零，播放中切曲会启动对应音源。
- `error` 通过 `aria-live` 区域反馈不支持或启动失败，不能只在控制台报错。

```text
用户点击 → AudioContext.resume → 停止旧振荡器 → 新建总线
→ 创建三个低音量正弦振荡器 → 设置 playing
→ interval 更新 elapsed → 暂停或到时停止音源
```

这是一种持续合成音景，播放时间不对应 `tracks` 中的示例时长字段；界面显示 `AMBIENT LOOP`。

## 6. 筛选、收藏、计时与问答

- `filter` 支持全部、四种心情和已收藏；`favorite` 保存当前会话内的索引数组。
- `toggleFavorite(index)` 增删索引；爱心按钮用 `aria-pressed`，空收藏显示说明与“探索声音”入口。
- 收藏没有写入 localStorage，刷新会重置；FAQ 已明确这一边界。
- `timer` 为 0、10 或 25，`elapsed >= timer * 60` 时停止声音并取消计时。
- 计时依据累计播放秒数；暂停期间不累加，切换音色会重新计时，后台节流可能影响精度。
- `faq` 为展开项索引或 `null`；按钮的 `aria-expanded`、`aria-controls` 与隐藏答案一致。

## 7. 移动端、降动效与五步验收

断点为 1050、760、440px，350px 以下另做窄屏调整；760px 下首屏由双列变单列，播放器保持独立区域。

- 图标按钮、声音筛选、仪式操作与取消计时均至少 44px 高；音量范围输入也是 44px 高的实际可拖动区域。声音图右下的播放圆是整块可点击封面的装饰，不是额外的嵌套按钮。
- 手机声音卡片改用两行 CSS Grid：曲名跨整行，心情说明与 44×44px 收藏按钮在下一行，避免扩大按钮后挤压英文曲名。320px 时曲名区预留两行。
- 手机声音说明、仪式正文、理念与 FAQ 答案为 14px，约 1.85–1.95 行高；播放器演示说明为 12px，音量与播放时间为 11px。装饰编号和眉题维持较小字号。
- 仪式卡在 760px 以下单列，每张以图标/正文两列网格组织；350px 以下行动按钮跨整行。卡片仍用原来的紫色透明层，按钮用细底线建立可点击提示。
- 首屏标题在 440px 以下使用 `clamp(54px, 18.5vw, 74px)`，同时缩放负字距；这修复了旧版 320px 时被页面 overflow 裁去右侧文字的问题。

文件末尾的 `Touch refinement` 区域记录手机重排；通用图标和仪式目标尺寸直接修改原规则，复刻时以最终计算样式为准。
`prefers-reduced-motion` 关闭装饰动画；显式滚动也检查该偏好，不影响音频操作本身。

1. 点击“听见片刻宁静”，确认声音产生、暂停能立即停止，播放器状态与图标一致。
2. 拖动音量至 0，再提高；切换下一个声音，确认标题、色彩和播放计时一起更新。
3. 收藏一项后筛选“已收藏”；取消最后一项时出现空态，返回全部可继续选择。
4. 选择专注仪式，确认计时提示与取消按钮；短时自动化可用测试时钟推进，不能只等 UI 文案。
5. 在 320px、390px、1440px、键盘操作和减少动态效果模式下检查菜单、所有播放按钮与 FAQ；同时用标题文字 Range 的边界验证文字未被 overflow 隐藏，不能只看页面没有横向滚动。

本轮 8 组针对性验证通过；结果为 `glass-results.json`，预览运行后可执行 `node artifacts/optimization/glass-check.mjs` 重验。截图与控件实测位于 [`artifacts/optimization/`](../../artifacts/optimization/) 的 `glass-*` 文件。优化前手机仪式按钮高 16px、播放器收藏 32×32px；优化后关键触控目标至少 44px。验证保留实际 Web Audio 振荡器启动、切轨频率、音量更新和停止调用，未做扬声器听感评估；10 分钟结束逻辑使用浏览器虚拟时钟推进验证。未新增音频模式、曲目或服务端功能。

## 8. 研究依据与适用范围

- [Material Web Theming](https://github.com/material-components/material-web/blob/main/docs/theming/README.md)：已读设计令牌分层；这里转化为背景、文字、强调与边框角色。
- [Motion](https://github.com/motiondivision/motion)：已读状态驱动过渡的功能定位；本站以原生 CSS 实现动效，未安装 Motion。
- [React Aria](https://github.com/adobe/react-spectrum)：已读行为与状态分离的定位；用于检视播放、收藏及筛选的输入与反馈。
- 完整证据与未访问的视频平台见 [研究来源](../../docs/SOURCES.md)。这些来源不是 Web Audio 音乐效果的医学或性能证据。

AURA 是原创视觉与技术习作，不提供录制歌曲、音乐版权服务、睡眠治疗或科学功效承诺。
