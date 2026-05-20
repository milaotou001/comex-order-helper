# COMEX 金银 ETF 挂单换算器

手机端优先的网页工具。输入 COMEX 黄金或 COMEX 白银买点与止损，按固定 1:2 盈亏比自动生成止盈，并换算 IAU、UGL、SLV、AGQ 挂单参考价。

## 本地运行

```bash
npm install
npm run dev
```

复制 `.env.example` 为 `.env.local`，填入 `MARKET_DATA_API_KEY` 后可手动刷新行情。API Key 只在服务端 `/api/quotes` 使用。

## 测试

```bash
npm test
```
