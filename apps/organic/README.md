# MORI 森间：植物与生活品牌独立站复刻指南

用植物、陶器和柔和留白表达慢生活，再把浏览、商品详情、购物袋与订单摘要串成完整任务。本套是独立站点，拥有自己的导航、品牌故事、养护内容和页脚，不使用统一展示框架。

## 运行、构建与目录

从仓库根目录使用已验证的 Node.js 24 环境：

```bash
cd /workspace/GptTest
npm ci
npm run dev -- --mode organic
```

默认开发端口 `5179`；可追加 `--port 5279`。项目依赖与锁文件都在仓库根。

```bash
npm run typecheck
npm run build -- --mode organic
npm run preview
```

产物为 `dist/organic/`，根预览访问 `/organic/`。类型检查会覆盖仓库全部站点。

- [index.html](index.html)：中文页面、标题、元信息和根节点。
- [src/main.tsx](src/main.tsx)：`products`、`Botanical`、`Dialog`、`App`；所有商品与交互可在这里定位。
- [src/styles.css](src/styles.css)：站内全部视觉与响应式，未引用其他站点 CSS。
- [BATCH-01.md](../../docs/reviews/BATCH-01.md)：购物袋运费、移动布局等实测记录。

## 当前视觉 token

| 用途 | 实际数值 | 位置 |
| --- | --- | --- |
| 主纸色 | `#f5f2e9` | `--paper`、`:root` |
| 主绿 | `#35482f` | `--green`、按钮与公告条 |
| 正文 | `#303b2c` | `:root` |
| 弱化信息 | `#7a7e6e` | `--muted` |
| 分隔线 | `#dcded1` | `--line` |
| 拱形背景 | `#e2e5d7` | `.arch-bg` |
| 故事深底 | `#36472f` | `.story` |
| 主标题 | `clamp(48px,5.5vw,82px)`、行高 `1.42` | `.hero h1` |
| 版心 | 最大 `1500px`，左右 `5%` | `.hero`、`.section-wrap` |
| 商品网格 | 三列，行距 `36px`、列距 `25px` | `.product-grid` |

中文标题使用宋体/衬线回退，正文使用 Helvetica Neue/Arial/中文无衬线回退；无在线字体请求。圆角主要用于按钮与拱门，商品图仅 `3px`，不要把所有区块改成同样的圆角卡片。

## 页面骨架与搭建顺序

1. 写公告条、`mori` 字标、主导航和购物袋按钮；数量从状态计算，初始为 `00`。
2. 建双栏 `.hero`：左侧两行中文、说明和主行动，右侧拱形底、植物、印章、标本说明。
3. 放价值说明横条，再建商品区：分类工具栏 → 商品网格 → 演示说明。
4. 用深绿色 `.story` 打断浅色节奏；左侧植物线描，右侧品牌观点与签名。
5. 补三条养护建议、原生 details FAQ、来信表单、页脚，再接商品详情和购物袋窗口。

主要断点为 1000px 与 700px。700px 以下首屏上下堆叠，商品保留两列，故事和养护变单列；购物袋最大宽度不超过屏幕。手机不靠整体缩小页面实现适配。

## 植物和器物：从 SVG 规则复刻

`Botanical({ variant, id, hero })` 使用 `500×590` 坐标。它是全部商品图与首屏图的共同绘图函数，但不承载业务状态。

- 先画底部虚化椭圆阴影，再画器物或植物，保持所有产品落在同一地平线上。
- 植物盆用梯形路径和顶部椭圆叠出厚度；陶土 `linearGradient` 从深棕到浅粉再回深棕。
- 六片叶子用 `{x,y,r,s}` 参数做平移、旋转、缩放；叶片、叶脉与主干分层，而不是复制整张图片。
- `variant=1/3/5` 分别采用完整叶、开裂叶和波状叶路径；`2/4/6` 是陶瓶、台灯和水壶。
- `id` 前缀区分 `hero`、`product-1`、`detail`、`bag-1` 等实例，让渐变与滤镜引用不冲突。

```css
.arch-bg {
  background: #e2e5d7;
  border-radius: 250px 250px 5px 5px;
}
.round-stamp { transform: rotate(-15deg); }
```

首屏图轻微旋转 `-3deg`，印章形成相反尺度的视觉锚点。商品 hover 在 `.6s` 内缩放 `1.04` 并旋转 `2deg`；减少动态效果模式会去掉这些变换。
故事区线描也由 SVG 叶片重复生成，与商品图共享植物语汇，但改用细描边而非立体填色。

## 业务状态与关键定位

| 状态/函数 | 用途 | 约束 |
| --- | --- | --- |
| `products` | 六商品的 ID、类别、价格、插画、养护说明 | `plants` 与 `objects` 各三件 |
| `category` | 全部/植物/器物筛选 | 对真实数组过滤；按钮 `aria-pressed` 同步 |
| `selected` | 商品详情 | 空值关闭；内容来自同一个商品对象 |
| `bag` / `add` / `change` | 购物袋与数量 | `mori-bag` 本地持久化；每件 1–99，减为 0 删除 |
| `count` / `total` | 件数与商品合计 | 从 `bag` 和价格派生，不建立独立金额状态 |
| `cartOpen` / `order` | 抽屉与摘要 | 修改数量后清除旧摘要状态 |
| `message` | 添加成功提示 | `role=status`，2.5 秒后自动清除 |
| `subscribed` | 来信意向反馈 | 当前页面内显示成功；不发送邮件、不持久保存邮箱 |

读取 `mori-bag` 时先验证对象类型、真实商品 ID、整数与数量范围；存储异常退回空袋。写入失败时页面内体验仍可继续。
运费规则：商品合计满 `299` 为 `0`，否则 `18`。摘要显示总计，但不付款、不生成服务器订单。
`Dialog` 自行实现名称、Esc、Tab 循环、背景滚动锁定和焦点返回；商品弹窗与购物袋共用这个站内组件。

## 五步验收

1. 在 1440px 查看三列商品与双栏首屏；390px 查看两列商品、单列故事和导航菜单，无横向滚动。
2. 点“有生命的绿”应剩三件；打开橡皮树详情，标题、说明、价格 `¥168` 与卡片一致。
3. 加入一件橡皮树，刷新后袋中仍一件；总计 `168+18=186`。增至两件后达到包邮，总计 `336`。
4. 生成摘要应明确“未创建真实订单”；再修改数量应回到可生成摘要状态。减到零后显示空袋提示。
5. 用 Tab/Shift+Tab 遍历窗口，Escape 关闭并返回原按钮；手机导航选项点击后收起，FAQ 可展开，订阅仅显示本地反馈。

## 独立部署和后续接入

将 `dist/organic/` 的内容复制到静态站根目录即可。相对 `base:'./'` 支持静态子目录；保留 `assets/` 相对位置。无需其他样例、目录站或后端服务一起运行。

如果另建仓库，应补齐 React、React DOM、lucide-react、Vite、TypeScript 和自己的锁文件；当前 `apps/organic/` 共用仓库根构建配置。
购物袋只在同一浏览器同一站点源下持久保存；换设备不会同步。商品、价格、包邮和订阅均用于演示，真实商城需要库存、订单、支付和服务端金额校验。

## 已核验资料与使用方式

- [Material Theming](https://github.com/material-components/material-web/blob/main/docs/theming/README.md)：将颜色组织为角色的参考；本套采用自己的 CSS 变量，没有加载 Material 组件。
- [Radix Dialog 文档](https://github.com/radix-ui/website/blob/main/data/primitives/docs/components/dialog.mdx)：模态焦点、命名、关闭与焦点返回的检查依据；本套独立实现 `Dialog`。
- [React Aria](https://github.com/adobe/react-spectrum)：状态与输入行为应独立于外观；用于审视筛选和购物流程的键盘等价性。
- 更多证据见 [SOURCES.md](../../docs/SOURCES.md)。植物和器物 SVG 为原创构图；未把访问受阻的视频或社媒页面冒充已观看案例。
