# STATUS — COMEX 金银 ETF 挂单换算器

> 日常开发状态文件。每任务简短更新。阶段交接信息见 CURRENT.md（如存在）。

当前任务：MVP-1 真实行情源接入完成，等待阶段复核
当前执行者：Codex
最近提交：feat: connect comex futures and etf quotes
下一步：
1. 配置 COMMODITY_DATA_API_KEY 与 MARKET_DATA_API_KEY 后进行真实接口手动验收
2. 阶段结束前进行一次技术复核
MVP-1 完成记录（2026-05-21）：
- /api/quotes 聚合 API-Ninjas COMEX rolling futures 与 Twelve Data ETF 行情
- 真实行情返回 source: "mixed"、isMock: false、sources.comex/api-ninjas、sources.etf/twelvedata
- futures 或 ETF 任一源失败时整套 fallback 到 mock，并返回 warning
- Twelve Data symbol 辅助脚本仅用于 ETF reference data 查询
- README 与页面风险提示已说明 rolling futures contract price 仅供挂单换算参考
验证记录（2026-05-21 MVP-1）：
- npm test: 3 files, 13 tests, all passed
- npm run build: 3 routes compiled
- git diff --check: passed
MVP-0 手动验收记录（2026-05-20）：
- mock 行情正常显示
- COMEX 黄金、COMEX 白银点位输入正常
- IAU / UGL / SLV / AGQ 换算结果正常显示
- 三档价格展示正常，主复制按钮只复制单个挂单价
- 标准价 / 容易成交价 / 捡漏价切换逻辑符合使用习惯
- 结果卡三档价格展示正常
- UGL/AGQ 只复制参考价，复制整行为弱按钮
- 确认无 GLD、无 XAU/USD/XAG/USD 口径切换
验证记录（2026-05-20 第一轮）：
- npm install: 166 packages, 0 errors
- npm test: 2 files, 9 tests, all passed
- npm run build: 3 routes compiled
验证记录（2026-05-20 第二轮 fix）：
- 添加 mock 行情兜底、输入区改为多行 COMEX 点位、结果卡改为点位→ETF 换算
- npm test: 2 files, 8 tests, all passed / npm run build: 3 routes compiled
验证记录（2026-05-20 第三轮 fix）：
- 复制按钮改为单价格复制（标准/容易成交/捡漏价可切换）
- 设置面板加醒目"当前复制价格类型"选择器
- 主按钮显示复制 IAU/SLV：具体价格
- npm test: 2 files, 8 tests, all passed / npm run build: 3 routes compiled
禁止：
- 不要重新发散需求
- 不要把 GLD 加回来
- 不要把 XAU/USD、XAG/USD 口径切换加回来
- 不要接券商 API，不要自动下单
- 不要做 MVP-0 范围外的功能
