# COMEX 金银 ETF 挂单换算器

手机端优先的网页工具。输入 COMEX 黄金或 COMEX 白银买点与止损，按固定 1:2 盈亏比自动生成止盈，并换算 IAU、UGL、SLV、AGQ 挂单参考价。

## 本地运行

```bash
npm install
npm run dev
```

复制 `.env.example` 为 `.env.local`，填入 Twelve Data 配置后可手动刷新行情。API Key 只在服务端 `/api/quotes` 使用，不会写入前端代码。

```env
MARKET_DATA_PROVIDER=twelvedata
MARKET_DATA_API_KEY=你的_Twelve_Data_API_Key
IAU_SYMBOL=IAU
UGL_SYMBOL=UGL
SLV_SYMBOL=SLV
AGQ_SYMBOL=AGQ
```

## 行情源

`/api/quotes` 在服务端聚合两类行情：

- COMEX 黄金、COMEX 白银：Stooq 延迟商品期货行情，固定使用 `GC.F`、`SI.F`。
- IAU、UGL、SLV、AGQ：Twelve Data `/quote`。

不要把 `COMEX_GOLD_SYMBOL` 填成 `XAU/USD`，也不要把 `COMEX_SILVER_SYMBOL` 填成 `XAG/USD`。本项目不做现货金银口径切换。

Stooq 的 `GC.F`、`SI.F` 页面标注为 Cmdt Fut，属于延迟商品期货行情，不是实时交易数据。本工具用于挂单价格换算参考，不适合实时交易或高频交易；最终下单前请以 IBKR 实时盘口为准。

## Twelve Data ETF symbol 查询

ETF 列表可查 Twelve Data `/etf` reference data：

```text
https://api.twelvedata.com/etf?apikey=YOUR_API_KEY
```

项目也提供本地辅助脚本，读取 `.env.local` 或当前 shell 中的 `MARKET_DATA_API_KEY`，筛选 ETF reference data：

```bash
npm run symbols:twelvedata
```

可追加关键词缩小范围：

```bash
npm run symbols:twelvedata -- iau ugl slv agq
```

更多说明见 `docs/twelvedata-symbols.md`。

## 行情 fallback

`/api/quotes` 返回：

- `source: "mixed"` 且 `isMock: false`：使用真实聚合行情。
- `source: "mock"` 且 `isMock: true`：使用 mock 行情。
- `warning`：fallback 到 mock 时返回原因，前端展示后页面继续可用。
- `sources.comex: "stooq"`、`sources.etf: "twelvedata"`：真实行情成功时标明聚合来源。

未配置 Twelve Data API Key、Stooq COMEX futures 延迟行情源失败、Twelve Data ETF 源失败、返回数据缺少任一目标品种有效价格时，都会整套回退 mock 行情。

## 测试

```bash
npm test
npm run build
```
