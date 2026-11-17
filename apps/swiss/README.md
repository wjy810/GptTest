# GRID / 26：瑞士网格展览网站复刻指南

一个完整的独立设计节网站：先用大字和数字建立识别，再展示三场展览、三日日程与票务选择。所有内容属于虚构活动，交互可以运行，预约仅在当前页面生成摘要。

## 独立运行与构建

从仓库根目录运行，不要在 `apps/swiss` 里寻找单独的依赖锁文件。

```bash
cd /workspace/GptTest
npm ci
npm run dev -- --mode swiss
```

默认端口 `5176`；冲突时添加 `--port 5276`。已验证运行环境为 Node.js 24。

```bash
npm run typecheck
npm run build -- --mode swiss
npm run preview
```

产物在 `dist/swiss/`，根预览服务路径为 `/swiss/`。类型检查面向整个仓库。

- [index.html](index.html)：独立文档、标题和应用根。
- [src/main.tsx](src/main.tsx)：`exhibitions`、`schedule`、`ticketTypes`、`Poster`、`Burst` 与页面状态。
- [src/styles.css](src/styles.css)：网格、三种海报、响应式、票务和弹窗外观。
- [BATCH-01.md](../../docs/reviews/BATCH-01.md)：日期键盘修复与实际验收证据。

## 视觉 token 与版式规则

| 角色 | 当前数值 | 源码定位 |
| --- | --- | --- |
| 主红 | `#ed3728` | `--red` |
| 纸白 | `#f2f0e9` | `--paper` |
| 暖黑 | `#171715` | `--black` |
| 主字体 | Arial / Helvetica Neue / 中文无衬线回退 | `:root` |
| 封面分栏 | `1.3fr 1fr`，间隔 `30px` | `.hero-layout` |
| 数字 26 | `clamp(150px,20vw,290px)`，字距 `-.13em` | `.symbol-number` |
| 展览网格 | 三列，间隔 `24px` | `.exhibition-grid` |
| 日期切换 | 三等分，1px 实线框 | `.date-tabs` |
| 票务区 | 两列，间隔 `80px`，主红背景 | `.ticket-section` |

视觉不是给所有组件加红色：用大色块划分首屏和票务，中段用浅底承载信息，用黑线保持对齐关系。标题、数字和海报是主要图形，正文保持小而稳定的层级。

## 从空页面到完整站的搭建顺序

1. 建独立 header，右侧“预约参观”直接定位 `#tickets`；手机保留此主行动。
2. 建 `.hero-layout`：左侧三行英文宣言，右侧“26”及三条轨道；底部放日期与展览入口。
3. 用三条 `exhibitions` 数据生成海报卡片，附中文名称、分类、创作者。
4. 加 `.about-section` 的观点、两段说明及 03/09/∞ 数据；它负责解释展览，而非重复售票。
5. 建日程 tab 与过滤结果，再加入票种、人数、日期选择和摘要弹窗。

1000px 与 700px 是主要响应式断点；700px 以下海报单列、票务单列、导航折叠。日期仍保留三个并排入口，但将星期信息放在日期下面。

## 三张海报如何拆解

`Poster({ item })` 只生成视觉，外层 `.poster-button` 才承担按钮语义。海报标记 `aria-hidden`，可访问名称由外层“查看××展览详情”提供。

- **秩序**：16 个圆形成 4×4 网格；第 6、9 个索引用浅色建立偏差。最终 `.order-grid` 覆盖规则是绝对定位、宽 `72%`、正方形、距上 `16%`、距左 `14%`，不要只抄文件中更早的基础规则。
- **字体**：`Aa` 与 `Bb` 两层超大文字，行高 `.68`、字距 `-.12em`、整体旋转 `-9deg`；第二层使用主红形成阅读顺序。
- **运动**：九个椭圆，CSS 自定义属性 `--i` 驱动位置、尺寸和角度；第 i 个左移量、缩放量分别由 `calc()` 生成，不用九套手写类。

```css
.motion-art span {
  left: calc(2% + var(--i) * 4.5%);
  width: calc(95% - var(--i) * 6%);
  transform: rotate(calc(var(--i) * 7deg));
}
```

`Burst` 以 `100×100` SVG 放射出八根旋转矩形，首屏轨道则是 CSS 圆角边框。没有外部位图、WebGL 或视频依赖。小图形应跟随 `currentColor`，避免 emoji 在不同设备突然变色。

## 状态与交互映射

| 状态/函数 | 控制内容 | 实现要点 |
| --- | --- | --- |
| `date` / `moveDateTab` | 18/19/20 日活动 | 左右循环、Home/End、选中 tab 的 tabindex 为 0 |
| `selected` / `detailRef` | 展览详情 | 原生具名 dialog，Esc 关闭，焦点回到触发按钮 |
| `ticket` | 单日或三日通行证 | 原生 radio；三日票禁用单日日期选择 |
| `visitDate` | 单日入场日期 | `select` 的值用于摘要 |
| `quantity` | 1–6 人 | 两端按钮禁用；总额由单价×数量派生 |
| `booking` / `bookingRef` | 预约摘要 | 只显示当前选择，不调用付款或预约 API |
| `menu` | 手机导航 | 选择站内锚点后收起 |

日期内容在 `schedule` 数组：3 天各 3 场，共 9 场。票价来自 `ticketTypes`：单日 68、三日 158；避免把展示金额与计算金额分别硬编码。
`clickedBackdrop` 区分窗口内部空白与真正外侧遮罩；弹窗生命周期负责背景滚动锁定和恢复。
当前状态不写入本地存储；刷新会回到默认日期、单日票和一人。

## 五步验收

1. 1440px 检查三列海报及巨型“26”；390px 检查海报单列、导航折叠、日期三列，无水平溢出。
2. 键盘打开任一展览，确认标题与内容对应；Escape 关闭，焦点返回原卡片。
3. 聚焦 12.18，ArrowRight 选 12.19；End 选 12.20；Home 回 12.18；每次日程仅显示当天三场。
4. 选择三日通行并增加为两人，总额应为 `¥316`；日期选择禁用；摘要显示 `2026.12.18—20`、两人。
5. 切回单日、选择 12.19，摘要日期和价格更新；人数不能低于 1 或超过 6；打开减少动态效果偏好后页面仍完整。

## 单独部署与演示边界

将 `dist/swiss/` 的内容上传静态主机根目录，或保留在 `/swiss/` 子目录；`base:'./'` 让资源相对引用。页面由锚点导航组成，没有路由服务，也不需要其他样例站运行。

源码目录共用根 `package.json` 的 React、React DOM、lucide-react 和 Vite 配置；移到新仓库需要一起配置这些依赖与构建入口。
此样例没有真实地址、票务库存、支付或用户登记。若接真实活动，应由后端提供票价、席位、时区与订单状态，并设计错误和售罄反馈。

## 真实研究来源

- [IBM Carbon](https://github.com/carbon-design-system/carbon)：网格、布局、颜色、动效各司其职的系统化思路；本套没有加载 Carbon 组件。
- [React Aria](https://github.com/adobe/react-spectrum)：把外观、状态和键盘行为分别设计；本套 tab 行为在 `moveDateTab` 中自行实现。
- [Radix Dialog 文档](https://github.com/radix-ui/website/blob/main/data/primitives/docs/components/dialog.mdx)：用来核对模态窗口的名称与焦点行为。
- [Codrops 排版示例](https://github.com/codrops/OnScrollTypographyAnimations)：大字构图的研究入口；本套不声称复刻其未观察的原版动效。
- 阅读证据见 [SOURCES.md](../../docs/SOURCES.md)。海报、品牌和活动均为原创风格研究内容。
