# 本轮交付验证

验证日期：2026-11-17。范围为十二套独立网站与资料目录；浏览器使用本机 Chromium，Node.js 为 24.22.1。以下为当前环境实际执行结果，不代表 GitHub Actions 或其他浏览器已通过。

| 项目           | 实际结果                                                                                                                      |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 锁文件安装     | `npm ci --cache /workspace/.npm-cache` 成功                                                                                   |
| 静态类型       | `npm run typecheck` 通过                                                                                                      |
| 独立生产构建   | `npm run build:all` 构建 13 个独立 HTML 入口成功                                                                              |
| 生产浏览器套件 | `npm test`，56 项通过，0 失败，0 跳过；本次耗时 40.1 秒                                                                       |
| 多站开发启动   | `npm run dev:all` 后运行 `node scripts/verify-dev.mjs`；5173–5185 的 13 个入口均渲染主标题，HTTP 200，无页面错误或资源错误    |
| 文档一致性     | 24 份现有 Markdown、142 条本地相对链接无缺失目标，站点 mode 均有效；扫描范围为本文件加入前的十二站教程、根说明及研究/复盘文档 |
| 最终目录       | 12 张生产页面实拍截图；1440px 和 390px 检查均无横向溢出、页面错误或缺图                                                       |

## 开发启动中发现的修复

首次同时启动 13 个 Vite 进程时，默认依赖预打包缓存共用，资料目录的 `react-markdown` 与 `remark-gfm` 请求返回 504。生产构建没有该问题。现由 `vite.config.ts` 为每站分配 `node_modules/.vite/<site>`，重启所有开发服务后完整验证 13 个入口。

复跑方式：先在一个终端执行 `npm run dev:all`，在另一终端执行 `node scripts/verify-dev.mjs`。脚本实际打开每个站点，并保存 [开发启动结果](../artifacts/reviews/dev-startup.json)。单站开发仍使用 `npm run dev -- --mode <site>`。

## 证据与范围

- [56 项测试输出](../artifacts/reviews/final-tests.txt)，覆盖独立文档、桌面/手机、资源与溢出，以及阅读收藏、购物袋、音频、命令、下载、预约、行程、游戏、服务检索、建筑简报与金融计算等流程。
- [最终构建输出](../artifacts/reviews/final-build.txt)。最后一次构建包含每站独立开发缓存配置；该配置不改变生产页面代码。此前 56 项生产套件通过后没有修改页面实现。
- [桌面目录](../artifacts/reviews/catalogue-final-desktop.png)与[手机目录](../artifacts/reviews/catalogue-final-mobile.png)。每站原始首屏截图在 `apps/catalogue/public/previews/`。
- 四批审核分别记录在 [01](reviews/BATCH-01.md)、[02](reviews/BATCH-02.md)、[03](reviews/BATCH-03.md)、[04](reviews/BATCH-04.md)。检查组与断言统计口径不同，不合并成一个总数。
- `.github/workflows/verify.yml` 已配置安装、类型、构建与浏览器验证；本文不声称远端 CI 已运行或通过。

未执行 Safari/iOS 真机、人工屏幕阅读器、真实用户测试或真实支付/政务/金融接口验证。研究档案中 17 项为已读取资料，13 项为网络受限入口；B 站、YouTube 视频未观看，不计为已研究视频。
