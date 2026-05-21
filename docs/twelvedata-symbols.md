# Twelve Data symbol 查询说明

MVP-1 使用 Twelve Data 作为唯一真实行情源。ETF 与 COMEX 商品 symbol 必须以 Twelve Data reference data 返回结果为准，不要按 CME 产品代码直接假设 `/quote` 可识别。

## 查询接口

ETF 列表：

```text
https://api.twelvedata.com/etf?apikey=YOUR_API_KEY
```

商品列表：

```text
https://api.twelvedata.com/commodities?apikey=YOUR_API_KEY
```

## 查询步骤

1. 先用 `/etf` 查找 `IAU`、`UGL`、`SLV`、`AGQ` 是否存在，并记录 Twelve Data 返回的 `symbol`。
2. 再用 `/commodities` 查找 COMEX 黄金、COMEX 白银相关结果。
3. 将 Twelve Data 返回的黄金、白银 `symbol` 分别填入 `.env.local` 的 `COMEX_GOLD_SYMBOL`、`COMEX_SILVER_SYMBOL`。
4. ETF symbol 通常可填 `IAU`、`UGL`、`SLV`、`AGQ`，但仍以 `/etf` 返回结果为准。

## 本地辅助脚本

配置 `.env.local` 后运行：

```bash
npm run symbols:twelvedata
```

脚本会读取 `.env.local` 或当前 shell 中的 `MARKET_DATA_API_KEY`，分别请求 `/etf` 和 `/commodities`，并按关键词筛选可能相关的记录。脚本不会打印 API Key。
