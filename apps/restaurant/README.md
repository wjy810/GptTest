# EMBER · 炉边餐厅

独立餐厅品牌网站，以酒红、奶油黄和炭火插画表达“食物、季节、相聚”。拥有完整导航、主视觉、菜单、炉边故事、预约表单、到店信息与页尾，不依赖其他样例的页面框架。

## 运行与构建

在仓库根目录执行：

```bash
npm ci
npm run dev -- --mode restaurant
npm run build -- --mode restaurant
```

开发端口为 `5180`，独立构建产物为 `dist/restaurant`。部署时上传该目录内容；入口中的相对资源路径支持子路径部署。Node 与依赖版本以根目录 `package.json` 和 lockfile 为准。

## 文件与复刻路线

- [`index.html`](index.html)：独立入口与中文页面元信息。
- [`src/main.tsx`](src/main.tsx)：菜品数据、原创餐盘/炉膛 SVG、页面结构和预约状态。
- [`src/styles.css`](src/styles.css)：独立视觉语言、三列/两列菜单、窄屏和降动效规则。
- [`verify.mjs`](verify.mjs)：本地浏览器交互检查与截图脚本。

建议按这个顺序复刻：

1. **从内容骨架开始。** 导航连接 `#story`、`#menu`、`#visit`、`#reserve`。先使页面锚点和阅读顺序成立，再加图形。
2. **完成封面双栏。** 左侧是中文主题、英文衬线副标题和行动按钮；右侧是一张放大的餐盘。右栏使用径向渐变，两个细线圆环增强景深。
3. **绘制餐盘。** `Plate` 组件用同一餐盘底座与六种食物形状组合。React `useId()` 为渐变/滤镜生成唯一 ID，避免多张 SVG 互相引用错误。
4. **接入菜单数据。** 六道菜分别有分类、中文名、英文名、描述、价格与 SVG 类型。筛选只改变展示，不修改源数组；“全部”恢复六道。
5. **加入品牌故事。** `Hearth` 是原创拱形炉膛 SVG；桌面图文并排，手机上下排列。这个段落独立承担品牌叙事，不把内容全部塞进卡片。
6. **完成预约状态机。** 用户选择日期、时间和人数后，生成本地确认对话框。表单与确认面板都明确“未产生真实订位”。
7. **检查边界。** 空日期、过去日期、人数 1/8、Escape、Tab、减少动态效果和窄屏都要实际操作。

## 具体视觉参数

| 参数     | 当前值                          | 作用                         |
| -------- | ------------------------------- | ---------------------------- |
| 品牌酒红 | `#511e28`                       | 封面、按钮、预约背景与主文字 |
| 奶油底   | `#f3ead8`                       | 菜单与全站画布               |
| 炉火铜橙 | `#edac76`                       | 封面关键词                   |
| 分隔带   | `#e9b879`                       | 从封面转入菜单               |
| 主标题   | `clamp(42px, 4.6vw, 73px)`      | 宽屏中文主题                 |
| 标题字体 | 系统宋体 / Noto Serif / Georgia | 本地字体降级，无外部字体请求 |
| 菜单网格 | 宽屏三列，680px 以下两列        | 保留菜单比较效率             |
| 菜单动效 | 500ms 小幅转动与缩放            | 只作为视觉反馈；降动效时关闭 |

```css
.hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: #511e28;
  color: #f3ead8;
}
.dish-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 40px 25px;
}
@media (max-width: 680px) {
  .hero {
    grid-template-columns: 1fr;
  }
  .dish-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
```

## 预约行为与边界

- 日期以 **Asia/Shanghai / UTC+8 餐厅时间** 判断当天，与新加坡同一 UTC 偏移；不使用 `toISOString()` 截断来计算当地日期。
- `<input type="date">` 使用 `required` 和 `min`，提交函数再次校验日期，即使原生 `min` 被移除也拒绝过去日期。
- 人数范围为 1–8，边界按钮禁用；时间从预设晚餐时段选择。
- 确认使用原生 `<dialog>.showModal()`，锁定背景滚动；Tab 保持在面板内，Escape 和“返回修改”关闭后恢复焦点。
- 输入保留在当前会话内，不发送网络请求，不生成真实订单、不保存个人资料。
- 地址、营业时间、菜品与价格均为原创演示内容。

## 实际验证

运行开发服务后，在仓库根目录执行：

```bash
node apps/restaurant/verify.mjs
```

脚本使用已安装的系统 Chromium（`/usr/bin/chromium`）；其他机器可改为自己的浏览器路径或已安装 Playwright 的 Chromium。结果写到 `artifacts/reviews/restaurant-results.json`，截图为 `restaurant-1440.png`、`restaurant-390.png`、`restaurant-320.png`。

本轮检查覆盖菜单分类、空/过去日期、提交独立校验、人数上下限、本地确认内容、对话框焦点、Escape 恢复、跳转链接、减少动态效果、三种宽度横向溢出和浏览器异常。它不是真实餐厅服务测试，不包含真实库存、订单、支付或邮件。

## 参考与进一步练习

本网站使用原创文字和 SVG；借鉴的是餐饮品牌中的戏剧性排版、材质配色、食物主视觉与短路径预约模式，不冒充某一家餐厅的完整复制。资料核验范围见根目录 [来源索引](../../docs/SOURCES.md)，研究方法见 [RESEARCH-METHOD.md](../../docs/RESEARCH-METHOD.md)。

可以继续练习：将菜单接到真实数据源、增加过敏原筛选、接入真实可订位时段。在接入后台前，应继续保留本地演示提示；真实订位需要服务器再次校验日期、席位与重复提交。
