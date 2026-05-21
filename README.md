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
COMEX_GOLD_SYMBOL=以_Twelve_Data_commodities_返回为准
COMEX_SILVER_SYMBOL=以_Twelve_Data_commodities_返回为准
IAU_SYMBOL=IAU
UGL_SYMBOL=UGL
SLV_SYMBOL=SLV
AGQ_SYMBOL=AGQ
```

## Twelve Data symbol 查询

不要假设 CME 黄金、白银产品代码 `GC`、`SI` 一定能被 Twelve Data `/quote` 识别。COMEX 黄金、COMEX 白银的 symbol 必须以 Twelve Data reference data 返回结果为准。

ETF 列表可查 Twelve Data `/etf` reference data：

```text
https://api.twelvedata.com/etf?apikey=YOUR_API_KEY
```

商品列表可查 Twelve Data `/commodities` reference data：

```text
https://api.twelvedata.com/commodities?apikey=YOUR_API_KEY
```

项目也提供本地辅助脚本，读取 `.env.local` 或当前 shell 中的 `MARKET_DATA_API_KEY`，筛选 ETF 和商品 reference data：

```bash
npm run symbols:twelvedata
```

可追加关键词缩小范围：

```bash
npm run symbols:twelvedata -- gold silver comex
```

更多说明见 `docs/twelvedata-symbols.md`。

## 行情 fallback

`/api/quotes` 返回：

- `source: "twelvedata"` 且 `isMock: false`：使用真实行情。
- `source: "mock"` 且 `isMock: true`：使用 mock 行情。
- `warning`：fallback 到 mock 时返回原因，前端展示后页面继续可用。

未配置 API Key、未配置 COMEX symbol、Twelve Data 请求失败、返回数据缺少任一目标品种有效价格时，都会回退 mock 行情。

## 测试

```bash
npm test
npm run build
```
