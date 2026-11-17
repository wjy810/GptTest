# 公共服务与数据可读性：补充研究笔记

### USWDS · 公共服务与数据可读性

- 状态：文档已读 · 2026-11-17。本笔记是额外的领域专项研究，不计入主目录。主目录维持 30 条：17 条已读、13 条受阻。
- [Design principles](https://github.com/uswds/uswds-site/blob/main/pages/design-principles/overview.md)：实际阅读 Real user needs 与 Earn trust，强调用户研究、可靠性、诚实说明与数据管理。OPEN CITY 是概念站，不能借政府视觉让用户误以为正在使用真实政务。
- [Form accessibility guidance](https://github.com/uswds/uswds-site/blob/main/_includes/forms-guidance.html)：实际阅读 DOM 顺序、就近校验、fieldset/legend、必填说明与禁用态指导。中文表单可以直接写“所有字段均为必填”或逐项标注，不能只让浏览器提交后才提示。
- [Data visualizations](https://github.com/uswds/uswds-site/blob/main/_components/data-visualizations/data-visualizations.md)：实际阅读 Simplicity、Lossless representation、Clarity of intent 与 Accessibility。其核心是颜色克制、明确文本结论、无需悬停即可理解、提供数据表以及人工检查上下文；该页面是指导，不包含可直接复制的组件实现。

### 对后续独立站的直接设计约束

1. **OPEN CITY**：服务目录使用生活任务命名；搜索、分类和空态彼此一致；预约表单按 DOM 顺序排列、明确必填项；本地确认需要突出“不形成真实预约”。
2. **MONO**：金额采用固定精度，表格数字右对齐；时间范围切换必须同时改变曲线、汇总和标签；图表附近提供起止数值及涨跌文本，并提供底层数据表入口。
3. **规划计算器**：把投入、期限、假设年率分别标明，结果区显示计算假设与投入/假设增值拆分；用户可以复算，不将示例推算描述为预测收益。
4. **复刻验收**：不是只看 SVG 是否漂亮；检查颜色失去辨识时是否仍有正负号、读取顺序、表头、数据单位和可操作入口。

这些约束来自文档阅读后的设计推导，未冒称已实施真实用户访谈。

## 金融图表的 D3 文档实读

2026-11-17 实际取得官方 GitHub 原文并阅读：

- [Linear scales](https://raw.githubusercontent.com/d3/d3/main/docs/d3-scale/linear.md)：线性变换 `y = mx + b` 将连续数据域映射到像素范围；默认不裁剪超出域的值。图表实现即便不用 D3 依赖，也应明确 domain/range 和单位。
- [Axis](https://raw.githubusercontent.com/d3/d3/main/docs/d3-axis.md)：坐标轴是可读的参考刻度，scale 更新后需要再次调用轴组件更新；本项目采用手写 SVG 时也要同步标签，不能只改曲线。
- [Format](https://raw.githubusercontent.com/d3/d3/main/docs/d3-format.md)：实际阅读浮点噪声案例、固定精度、货币、百分比、千位分组与地区格式。对齐数字位数才能有效比较；界面可以使用原生 Intl.NumberFormat 达成同样目的。

没有运行这些官方文档里的浏览器示例；上述记录描述文档证据与实现推导。
