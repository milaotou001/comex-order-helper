export function RiskNotice() {
  return (
    <section className="border-t border-line py-6">
      <h2 className="mb-3 text-lg font-semibold text-white">风险说明</h2>
      <p className="rounded-md border border-amber/40 bg-amber/10 px-4 py-3 text-sm leading-6 text-[#f5dca7]">
        UGL、AGQ 为 2 倍日内目标产品，仅适合当前价格附近的短区间参考。目标点位距离当前 COMEX
        金银价格越远，参考误差可能越大。最终挂单前请以 IBKR 实时盘口为准。
      </p>
    </section>
  );
}
