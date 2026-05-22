export function RiskNotice() {
  return (
    <section className="border-t border-line py-6">
      <h2 className="mb-3 text-lg font-semibold text-white">风险说明</h2>
      <p className="rounded-md border border-amber/40 bg-amber/10 px-4 py-3 text-sm leading-6 text-[#f5dca7]">
        COMEX 黄金、COMEX 白银行情来自 Stooq 延迟商品期货行情。UGL、AGQ 为 2 倍日内目标产品，仅适合当前价格附近的短区间参考。本工具用于挂单价格换算参考，不适合实时交易或高频交易；最终下单前请以 IBKR 实时盘口为准。
      </p>
    </section>
  );
}
