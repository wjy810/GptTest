# ROAM 漫游 — 独立旅行网站复刻手册

ROAM 是一个以原创山川插画、沙白纸感和蓝橙配色为核心的完整旅行网站。
它包含目的地探索、收藏、详情、漫游手记、预算计算与本地行程导出；自己的导航和页脚都在本站内。
本例不提供真实预订、报价、支付或旅游服务，也不把目录页作为运行外框。

## 1. 独立运行与发布

从仓库根 `/workspace/GptTest` 执行：

```bash
npm ci
npm run dev -- --mode travel
npm run build -- --mode travel
```

根 `vite.config.ts` 将 root 指向 `apps/travel`，开发端口为 **5181**。
构建目录为 `dist/travel/`；`base: './'` 使用相对资源路径，可整目录部署到静态站点。

```bash
# 只预览本网站，不依赖其他样例。
python -m http.server 4181 --directory dist/travel --bind 0.0.0.0
npm run typecheck
```

本站无服务端和外部图像请求。收藏存储在当前站点 origin 的 localStorage，迁移到新域名不会自动迁移收藏。

## 2. 页面结构与定位

| 区域       | 组件 / 选择器                       | 复刻重点                                   |
| ---------- | ----------------------------------- | ------------------------------------------ |
| 导航和首屏 | `App`、`.header`、`.hero`           | 独立导航、衬线大字与山川插画叠层           |
| 目的地     | `destinations`、`.destination-grid` | 六条数据驱动卡片、类别与收藏筛选           |
| 详情       | `detail`、`.detail-dialog`          | 展示建议活动、季节说明，并回填行程目的地   |
| 理念       | `.philosophy`、`.postcard`          | 海湾插画叠加倾斜明信片，拉开信息密度       |
| 手记       | `.journal-grid`                     | 两个可展开的真实内容清单，使用原生 details |
| 行程规划   | `.planner-form`、`.budget-total`    | 即时预算、人数边界与天数控制               |
| 草案       | `.summary-dialog`、`downloadPlan()` | 每日建议、明确计算式、Markdown 文件下载    |

## 3. 视觉令牌与布局

| 参数          | 实际值                                                           |
| ------------- | ---------------------------------------------------------------- |
| 纸面 / 主文字 | `#f7f6f0` / `#183e4e`                                            |
| 橙色图形强调  | `--orange: #d97645`                                              |
| 主要按钮      | 最终背景 `#b45b32`、文字 `#fffaf2`，悬停 `#9e4824`               |
| 小文字        | 最终修正规则使用 `#5e7074`，与装饰性浅色信息分开                 |
| 内容宽度      | `.shell` 最大 1280px，桌面宽度 `calc(100% - 120px)`              |
| 首屏标题      | Georgia/Times New Roman，`clamp(65px, 7.2vw, 105px)`，行高 `.98` |
| 桌面卡片      | 三列，列间距 25px、行间距 40px；图像区高 265px                   |
| 圆角          | 图片 7px、按钮 3px、弹窗 8px，避免整页变成圆角面板               |
| 主要断点      | 1100px、760px、480px；目的地依次三列、两列、单列                 |

复刻时先恢复首屏文字与山峰的关系，再处理装饰章、纹理和悬停提示。
正文和主要操作使用 DOM，插画不会吞掉文字或承担唯一的信息表达。

## 4. 原创 SVG 景观如何构成

`Scene({ kind, variant, hero })` 统一使用 `viewBox="0 0 900 600"`，输出三种原创场景。
这里的图形是主题插画，不是具体景点的照片、地图或精确地理还原。

1. 背景先画 `.sky` 矩形，再放 `.sun` 圆形与少量云线。
2. `mountain` 按远山、雪冠、近山、湖泊、前景土地的顺序画 path，保证视觉深度。
3. 树木是重复的三角轮廓，通过 translate 与 scale 改变位置和尺寸；小帐篷用三个多边形组成。
4. `island` 使用弧形海岸、平行水纹、棕榈树与沙滩遮阳伞，颜色由 `.landscape-*` 变量控制。
5. `city` 使用错落矩形、三角屋顶、窗格和树木；几何来自源码，无第三方图片资源。
6. `variant` 对应 pine、sage、teal、sand、terracotta、ochre；同一结构通过颜色产生不同气候感。
7. `.hero-art:before` 叠加渐变，将桌面左侧文字区与右侧场景融合；移动端改为由上到下的渐隐。
8. `.postcard` 使用 `rotate(-8deg)` 和阴影，伪元素是一小段半透明胶带；保持文字可读而非真实扫描图。

卡片 `art-button` 悬停只做 `scale(1.055)`，`prefers-reduced-motion` 下移除过渡。

## 5. 数据与收藏状态

`destinations` 保存 id、名称、分类、地区、建议天数、每日费用、交通费、场景、说明和活动建议。
`filter` 支持“全部 / 山野 / 海岛 / 城市 / 已收藏”；`visible` 从数据和收藏数组派生，避免复制列表状态。

- `loadSaved()` 读取 `roam-saved`，捕获读取或 JSON 错误；未知结构直接回退为空数组。
- 只有已知字符串 id 才保留，并通过 Set 去重；数字、null、未知目的地不会进入界面。
- `toggleSaved(id)` 更新收藏并写回 localStorage；写入被禁止时保留本页状态并展示提示。
- 收藏按钮使用 `aria-pressed`，名称在“收藏川西”和“取消收藏川西”等状态之间同步变化。
- “已收藏”没有结果时显示恢复入口，不留下空白网格。

## 6. 预算与每日行程

`current` 由目的地 id 派生；人数 `people` 限定 1–6，天数 `days` 使用 2–14 的 range 输入。
默认是川西、2 人、5 天；每日 420、交通 1200，因此默认合计 **6600**。

```text
dailyTotal = current.daily × days
perPerson  = dailyTotal + current.transport
total      = perPerson × people
例如泉州 6 人 14 天：(290 × 14 + 650) × 6 = 28260
```

`dayPlan(day)` 将首日设为抵达安顿、末日设为返程预留，中间天数循环引用目的地 highlights。
因此生成的是轻量可编辑的建议草案，不是经过地图距离、营业时间和交通时刻验证的优化路线。
`downloadPlan()` 生成 Markdown Blob、创建临时 URL、触发下载并释放 URL；文件包含计算式和演示边界。
`downloaded` 只表示文件生成，不能写成“预订成功”。重新打开草案会重置下载状态。

## 7. 弹窗、移动端与可访问性

`detailDialog` 与 `summaryDialog` 使用原生 dialog，通过 state effect 执行 `showModal()` 与 `close()`。
`trapDialogFocus()` 显式循环首末可聚焦元素；Esc、关闭按钮与 `onClose` 同步应用状态。
`closeOnBackdrop()` 检查指针是否真正位于 dialog 边界外，点击弹窗内部留白不会误关闭。
任意弹窗打开时 effect 锁定 body 滚动，关闭或卸载时恢复原 overflow；原生 dialog 处理焦点返回。
760px 下移动导航可展开，480px 下卡片单列；日程仍能独立滚动，行程内容不会超出屏幕宽度。

## 8. 五步验收与已有证据

1. 类别筛选分别得到两项；收藏一项后刷新仍保留，取消最后一项显示空态与恢复按钮。
2. 写入损坏 JSON、非法 id/类型/重复值，再测试被禁止的 Storage；页面继续工作且提示明确。
3. 详情打开后检查键盘首末循环、Esc、内部留白、body 锁定；点击“把这里放进行程”正确回填。
4. 核对默认 6600、泉州 1 人 2 天 1230、泉州 6 人 14 天 28260；上下界按钮禁用。
5. 生成 14 天草案并下载，读取 Markdown 确认人数、天数、预算及最后一天；检查 390px 和降动效模式。

当前实现已通过独立生产构建、单文件 TypeScript 检查、31 项 Chromium 功能断言及附加模态焦点/锁定验证。
证据位于 `artifacts/reviews/batch03-travel-results.json`、`batch03-travel-check.mjs` 和桌面/移动截图。

## 9. 研究依据与继续扩展

- [React Aria](https://github.com/adobe/react-spectrum)：已读交互行为、状态与外观分离的定位，对应数据筛选和表单反馈。
- [Radix Dialog 文档](https://github.com/radix-ui/website/blob/main/data/primitives/docs/components/dialog.mdx)：已读模态标题、键盘焦点和关闭规则，本站实际使用原生 dialog。
- [Material Web Theming](https://github.com/material-components/material-web/blob/main/docs/theming/README.md)：已读令牌分层，应用于景观颜色与语义色。
- 实际核验范围、受阻社媒和视频平台见 [研究来源](../../docs/SOURCES.md)；本页不是未观察过的旅行网站逐像素复制。

后续接入真实旅行服务时，应替换数据来源、核验报价口径与时效，再增加库存、费用明细和失败恢复流程。
