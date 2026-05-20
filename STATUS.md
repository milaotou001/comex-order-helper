# STATUS — COMEX 金银 ETF 挂单换算器

> 日常开发状态文件。每任务简短更新。阶段交接信息见 CURRENT.md（如存在）。

当前任务：MVP-0 页面修复完成，等待手动验收
当前执行者：Codex
最近提交：fix: align MVP-0 page with COMEX ETF conversion workflow
下一步：
1. 手动验收 MVP-0 页面功能
2. 阶段结束前进行一次技术复核
验证记录（2026-05-20 第一轮）：
- npm install: 166 packages, 0 errors
- npm test: 2 files, 9 tests, all passed
- npm run build: 3 routes compiled
验证记录（2026-05-20 第二轮 fix）：
- 添加 mock 行情兜底（未配置 API KEY 时自动使用）
- 输入区改为多行 COMEX 点位，移除买点/止损/止盈
- 结果卡改为点位→ETF 换算，含 IAU/SLV/UGL/AGQ 及复制按钮
- npm test: 2 files, 8 tests, all passed
- npm run build: 3 routes compiled
禁止：
- 不要重新发散需求
- 不要把 GLD 加回来
- 不要把 XAU/USD、XAG/USD 口径切换加回来
- 不要接券商 API，不要自动下单
- 不要做 MVP-0 范围外的功能
