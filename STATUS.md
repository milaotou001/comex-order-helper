# STATUS — COMEX 金银 ETF 挂单换算器

> 日常开发状态文件。每任务简短更新。阶段交接信息见 CURRENT.md（如存在）。

当前任务：MVP-0 本地验证通过，等待手动行情验证与下一轮复核
当前执行者：Codex
最近提交：feat: implement MVP-0 COMEX ETF order helper
下一步：
1. 配置 MARKET_DATA_API_KEY 后手动刷新验证行情
2. 阶段结束前进行一次技术复核
验证记录（2026-05-20）：
- npm install: 166 packages, 0 errors
- npm test: 2 files, 9 tests, all passed
- npm run build: compiled successfully, 3 routes (/, /_not-found, /api/quotes)
禁止：
- 不要重新发散需求
- 不要把 GLD 加回来
- 不要把 XAU/USD、XAG/USD 口径切换加回来
- 不要接券商 API，不要自动下单
- 不要做 MVP-0 范围外的功能
