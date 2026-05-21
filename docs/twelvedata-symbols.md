# Twelve Data ETF symbol 查询说明

MVP-1 中 Twelve Data 只用于 ETF 报价：IAU、UGL、SLV、AGQ。COMEX 黄金、COMEX 白银不使用 Twelve Data 的 `XAU/USD`、`XAG/USD` 现货口径，也不使用 Twelve Data commodities 结果替代 futures。

## 查询接口

ETF 列表：

```text
https://api.twelvedata.com/etf?apikey=YOUR_API_KEY
```

## 查询步骤

1. 先用 `/etf` 查找 `IAU`、`UGL`、`SLV`、`AGQ` 是否存在，并记录 Twelve Data 返回的 `symbol`。
2. 将 ETF symbol 填入 `.env.local` 的 `IAU_SYMBOL`、`UGL_SYMBOL`、`SLV_SYMBOL`、`AGQ_SYMBOL`。
3. COMEX 黄金、COMEX 白银由 API-Ninjas Commodity Price API 提供 rolling futures contract price，不在这里配置。

## 本地辅助脚本

配置 `.env.local` 后运行：

```bash
npm run symbols:twelvedata
```

脚本会读取 `.env.local` 或当前 shell 中的 `MARKET_DATA_API_KEY`，请求 `/etf` 并按关键词筛选可能相关的记录。脚本不会打印 API Key。
