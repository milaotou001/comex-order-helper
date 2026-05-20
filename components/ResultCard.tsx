"use client";

import { buildCopyLine, buildLeveragedCopy, buildPlainCopy, formatPercent, formatPrice } from "@/lib/format";
import type { ConvertedOrder, OrderSettings } from "@/lib/types";
import { CopyButton } from "./CopyButton";

type ResultCardProps = {
  order: ConvertedOrder;
  settings: OrderSettings;
  accent: "gold" | "silver";
};

export function ResultCard({ order, settings, accent }: ResultCardProps) {
  const fullLine = buildCopyLine(order, settings.decimals);
  const plainLine = buildPlainCopy(order, settings.decimals);
  const leveragedLine = buildLeveragedCopy(order, settings.decimals);

  const metalLabel = order.metal === "gold" ? "COMEX黄金" : "COMEX白银";

  const riskClass =
    order.riskLevel === "danger"
      ? "border-danger bg-danger/10 text-red-100"
      : order.riskLevel === "warning"
        ? "border-amber bg-amber/10 text-[#f7d99b]"
        : "border-line bg-panel text-silver";

  return (
    <article className={`rounded-md border ${riskClass} p-4 shadow-glow`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className={accent === "gold" ? "text-xs font-semibold text-gold" : "text-xs font-semibold text-silver"}>
            {metalLabel}
          </p>
          <h3 className="mt-1 font-mono text-2xl text-white">{order.point}</h3>
          <p className="mt-1 text-sm text-silver">距当前 {formatPercent(order.distancePercent)}</p>
        </div>
      </div>

      <div className="grid gap-2">
        <PriceRow label={`${order.plainSymbol} 标准挂单价`} value={order.standardPrice} decimals={settings.decimals} />
        <PriceRow label={`${order.plainSymbol} 容易成交价`} value={order.easyPrice} decimals={settings.decimals} />
        <PriceRow label={`${order.plainSymbol} 捡漏价`} value={order.bargainPrice} decimals={settings.decimals} />
        {settings.showLeveraged ? (
          <PriceRow label={`${order.leveragedSymbol} 参考价`} value={order.leveragedPrice} decimals={settings.decimals} />
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
        <CopyButton value={plainLine} label={`复制 ${order.plainSymbol}`} />
        {settings.showLeveraged ? (
          <CopyButton value={leveragedLine} label={`复制 ${order.leveragedSymbol}`} />
        ) : null}
        <CopyButton value={fullLine} label="复制整行" />
      </div>

      {order.riskLevel === "warning" ? (
        <p className="mt-3 text-sm text-[#f7d99b]">杠杆 ETF 参考误差可能放大</p>
      ) : null}
      {order.riskLevel === "danger" ? (
        <p className="mt-3 text-sm text-red-100">距离当前价格较远，杠杆 ETF 仅供粗略参考</p>
      ) : null}
    </article>
  );
}

type PriceRowProps = {
  label: string;
  value: number;
  decimals: number;
};

function PriceRow({ label, value, decimals }: PriceRowProps) {
  const formatted = formatPrice(value, decimals);

  return (
    <div className="flex min-h-11 items-center justify-between gap-3 rounded-md border border-line bg-ink/60 px-3">
      <span className="text-sm text-silver">{label}</span>
      <span className="font-mono text-white">{formatted}</span>
    </div>
  );
}
