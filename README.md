# GptTest

**FORM / FIELD — 独立 UI/UX 网站研究与复刻集。**

十二个方向，十二个完整网站。每站有独立 HTML、React 入口、CSS、导航、内容与交互，可以单独开发、构建和部署。资料目录只是索引，不用 iframe，不包住样例，不提供统一换肤外框。

这是代表性风格研究与原创实现，不是对某个品牌网站的逐像素复制，也不声称已搜索全部市场。第三方来源、核验状态与原始证据见 [来源档案](docs/SOURCES.md)。

## 独立网站

| 网站                       | 方向 / 视觉语言                         | 可操作内容                             | 开发端口 |
| -------------------------- | --------------------------------------- | -------------------------------------- | -------- |
| [FOLIO](apps/editorial)    | 编辑杂志 · 深梅紫、铜粉、纸感与衬线     | 文章分类、阅读窗口、持久收藏           | 5174     |
| [ODD](apps/brutalist)      | 创意工作室 · 粗野主义、荧光黄、超大字体 | 作品筛选、案例解构、项目简报下载       | 5175     |
| [GRID / 26](apps/swiss)    | 设计展览 · 瑞士网格、红黑白、几何海报   | 日期日程、展览详情、票种与预约摘要     | 5176     |
| [AURA](apps/glass)         | 声音产品 · 玻璃质感、紫色流体与柔光     | Web Audio 合成、切曲、音量、收藏、计时 | 5177     |
| [TRACE](apps/terminal)     | 开发工具 · 黑绿终端、代码工作台         | 命令模拟、配置切换、方案定价与详情     | 5178     |
| [MORI](apps/organic)       | 生活园艺 · 植物插画、橄榄绿与自然留白   | 商品筛选、详情、持久购物袋、订单摘要   | 5179     |
| [EMBER](apps/restaurant)   | 餐饮 · 酒红、奶油、戏剧性餐桌构图       | 季节菜单、预约表单与本地确认           | 5180     |
| [ROAM](apps/travel)        | 旅行 · 蓝橙、沙色、地理与山川           | 目的地筛选、收藏、行程预算             | 5181     |
| [MONO](apps/fintech)       | 金融数据 · 暗色信息面板与紫薄荷色       | 示例走势图、资产筛选、假设计划计算     | 5182     |
| [OPEN CITY](apps/civic)    | 公共服务 · 明确信息层级与市政蓝         | 服务查找、分类与预约流程               | 5183     |
| [P1XEL](apps/arcade)       | 游戏 · 霓虹街机与像素感                 | 可玩的反应速度游戏、本地成绩           | 5184     |
| [STILL](apps/architecture) | 建筑 · 克制黑灰、比例与空间             | 项目浏览、筛选与项目说明               | 5185     |

资料目录为 [apps/catalogue](apps/catalogue)，开发端口 5173。

## 运行

需要 Node.js 22.12+（当前实例验证版本 24.22.1）及 npm。

```bash
npm ci

# 单独开发任意一站，无需启动资料目录
npm run dev -- --mode editorial

# 或同时启动各站，资料目录可以直接跳转
npm run dev:all

# 单站构建：产物完全独立，可上传到任意静态主机根目录
npm run build -- --mode editorial
# 输出 dist/editorial/

# 全部构建后使用同一端口预览，仍是各自独立 HTML 文档
npm run build:all
npm run preview
# 端口 4173：/editorial/、/swiss/ 等；根路径为资料目录
```

不要同时启动 `dev:all` 和已占用相同端口的单站开发服务。端口冲突时用 `--port` 覆盖单站端口；资料目录默认开发链接依照上表。

生产资源使用相对路径 `base: './'`。你可以只部署 `dist/organic/`，该网站无需本仓库其他站点运行。目录整体部署需保持 `dist` 下各子目录；资料目录内部资料页通过构建嵌入，不依赖远端文档加载。

## 验证与每三套复盘

```bash
npm run typecheck
npm run build:all
npm test
```

Playwright 优先使用 `CHROMIUM_PATH`，其次检测 `/usr/bin/chromium`，否则使用 Playwright 自带 Chromium；普通开发机可先运行 `npx playwright install chromium`。测试针对生产构建，执行前需要 `build:all`。

- [第一批：FOLIO / GRID / MORI](docs/reviews/BATCH-01.md)
- [第二批：ODD / AURA / TRACE](docs/reviews/BATCH-02.md)
- [第三批：EMBER / ROAM / P1XEL](docs/reviews/BATCH-03.md)
- [第四批：MONO / OPEN CITY / STILL](docs/reviews/BATCH-04.md)

复盘记录会列出实际发现、修复与验证，不把构建成功等同于设计或功能通过。截图与部分可重复审核脚本保存在 `artifacts/reviews/`；各站独立 Git 提交方便回看与提取。

[本轮最终验证](docs/VALIDATION.md)：56 项生产浏览器测试通过，13 个独立构建及开发入口通过。多站开发使用各自的 Vite 缓存，避免依赖预打包相互覆盖。

## 复刻知识库

- [逐步复刻教程](docs/REPLICATION.md)：拆解布局、排版、图形、状态、动效与移动端。
- [视觉与交互规则](docs/DESIGN-SYSTEM.md)：从原则到 CSS 参数，如何保持各站独立性。
- [研究方法与视频取证](docs/RESEARCH-METHOD.md)：B 站、YouTube、设计社区的检索与时间码记录。
- [30 个研究来源及证据](docs/SOURCES.md)：17 个已读取官方资料，13 个因网络限制待核验入口。
- [持续扩展协议与后续路线](docs/CONTINUATION.md)：每三套暂停复盘，修复后再扩展。

所有品牌、文章、商品、价格、活动、图表与项目案例用于设计演示。支付、预约、部署、金融行情等没有连接真实后台；交互会说明本地模拟范围。AURA 使用浏览器真实合成音频，文件下载与浏览器本地存储也实际执行。

站点图形主要为项目内原创 CSS/SVG；没有把外部平台的视频或品牌素材打包进来。来源核验代表实际读取了指定文档或源码，不代表已体验原站所有页面或观看对应平台视频。
