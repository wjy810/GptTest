# 十二站优化记录

日期：2026-11-17。保留十二个独立 HTML、视觉系统、交互与构建产物；资料目录仍只负责发现、查阅和跳转。本轮针对实际页面进行优化，没有增加新方向或声称读过新的外部案例。

## 每套具体改进

| 网站      | 本轮变化                                                                                       |
| --------- | ---------------------------------------------------------------------------------------------- |
| FOLIO     | 主故事与三篇索引形成阅读主次；手机封面缩短并显示阅读入口；保存失败有可见提示                   |
| GRID / 26 | 展览编号、类别与日程重新组织；提升时间和地点字号；修复320px海报内部标题裁切                    |
| MORI      | 保留植物完整轮廓，补充养护和用途信息；真实标本切换、排序与手机购物袋入口；修复浮条卸载后的回焦 |
| ODD       | 320px标题计数不再撑宽页面；手机海报高度390→340px，标题点击区26→44px；桌面画面保持              |
| AURA      | 收藏、计时与播放操作区扩大；声音卡片重排，修复320px首屏标题裁切；真实音频逻辑保留              |
| TRACE     | 命令输入16px、44px高；日志长行缩进、终端密度和模拟说明更清楚                                   |
| EMBER     | 食材、营业规则更易读；人数操作44×44；窄屏日期和时段纵排，菜名和价格分行                        |
| ROAM      | 收紧手机景观图和卡距，保留正文大小；已有规划区在390px同视口前移约381px，增加明确直达入口       |
| P1XEL     | 游戏与收藏移至独立操作行，DOM与视觉顺序一致；扩大规则、反馈和成绩，修复四位成绩溢出            |
| MONO      | 扩大手机控制区域和输入文字；日期刻度稀疏显示以避免碰撞，保留原始坐标、数据、公式与CSV          |
| OPEN CITY | 常用服务入口扩大，搜索和预约输入16px，320px服务分类自动换行；保持蓝白任务门户结构              |
| STILL     | 收紧手机介绍留白，作品标题提前约103px，全幅建筑画面保留；表单16px、窄屏下拉框纵排              |

以上数值来自相同视口的成对测量，不混用不同高度、不同选择器的坐标。各站 `apps/<site>/README.md` 记录源码入口、参数、实际验证与证据链接。

## 资料目录

- 删除不再使用的草图预览代码，全部采用优化后十二站的真实首屏截图。
- 手机卡片由窄双列改为单列，说明文字10→14px，避免中文碎行；因此整页更长，这是阅读宽度的取舍。
- 来源增加主题与证据状态组合筛选、每页9条的分页、清空和焦点恢复；30条来源仍可完整访问。
- 阅读器按需加载。首屏JavaScript由491,981字节降为267,560字节，约减少45.6%；这是未压缩脚本字节数，不是加载耗时提升比例。
- 阅读器加载失败时仍可下载原文和关闭窗口，并说明刷新恢复方式。生产与Vite开发模式都实际验证了阅读、GFM表格和下载。

最终目录：[桌面截图](../artifacts/optimization/catalogue-final-desktop.png)、[手机截图](../artifacts/optimization/catalogue-final-mobile.png)。原始测量见 [目录优化前](../artifacts/optimization/catalogue-before-metrics.json)和[优化后](../artifacts/optimization/catalogue-after-metrics.json)。

## 每三套复盘

| 批次 | 独立报告                                               | 重点                                               |
| ---- | ------------------------------------------------------ | -------------------------------------------------- |
| 01   | [FOLIO / GRID / MORI](reviews/OPTIMIZATION-01.md)      | 阅读和商品层级、海报内部裁切、临时按钮卸载后的焦点 |
| 02   | [ODD / AURA / TRACE](reviews/OPTIMIZATION-02.md)       | 窄屏根因修复、声音操作区、终端输入与长日志         |
| 03   | [EMBER / ROAM / P1XEL](reviews/OPTIMIZATION-03.md)     | 菜单与预约、规划入口、四位游戏成绩和操作顺序       |
| 04   | [MONO / OPEN CITY / STILL](reviews/OPTIMIZATION-04.md) | 图表标签间距、数据表横滚、表单与画廊留白           |

复盘独立于实现者，并记录真实发现和修后行为。网站和复盘分别提交，Git历史可逐套追踪。

## 验证方式与范围

```bash
npm run typecheck
npm run build:all
npm test
python artifacts/reviews/scan-doc-consistency.py artifacts/optimization/doc-consistency.json
```

正式浏览器套件增加320px窄屏和可编辑文字字号检查，并覆盖来源分页、阅读器加载失败时的原文下载、购物袋浮条键盘回焦、四个金融周期的日期标签间距。不会用整页无溢出代替内部裁切检查。

最终统一执行结果：TypeScript通过，13个独立入口全部生产构建成功，**73项浏览器测试通过，0失败、0跳过，本次49.5秒**。浏览器为本机Chromium；本轮没有改动依赖声明或锁文件，沿用已安装并验证的Node.js 24.22.1环境。

原始证据：[类型检查](../artifacts/optimization/final-typecheck.txt)、[完整构建](../artifacts/optimization/final-build.txt)、[完整测试](../artifacts/optimization/final-tests.txt)、[本地文档链接](../artifacts/optimization/doc-consistency.json)、[产物字节数](../artifacts/optimization/assets-after.json)、[目录开发模式验证](../artifacts/optimization/catalogue-development.json)。GitHub Actions配置仍在仓库，但此报告不声称远端CI已经通过。

所有本地模拟边界保持：无真实交易、订单、预约或邮件发送；音频合成、游戏、下载及明确声明的浏览器存储实际执行。本轮未做Safari/iOS真机、人工屏幕阅读器或真实用户研究，也未新增已观看视频的声明。原研究档案仍为17条已读资料、13条待核验入口。
