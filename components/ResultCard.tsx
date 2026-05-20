"use client";

import { buildCopyLine, formatPercent, formatPrice } from "@/lib/format";
import type { ConvertedOrder, OrderSettings, PointKind } from "@/lib/types";
import { CopyButton } from "./CopyButton";

type ResultCardProps = {
  order: ConvertedOrder;
  settings: OrderSettings;
  accent: "gold" | "silver";
};

const POINT_LABELS: Record<PointKind, string> = {
  entry: "买点",
  stop: "止损",
  target: "止盈"
};

export function ResultCard({ order, settings, accent }: ResultCardProps) {
  const line = buildCopyLine(order, settings.decimals);
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
            {POINT_LABELS[order.pointKind]}
          </p>
          <h3 className="mt-1 font-mono text-2xl text-white">{order.point}</h3>
        </div>
        <CopyButton value={line} label="复制整行" />
      </div>

      <div className="grid gap-2">
        <PriceRow label={`${order.plainSymbol}标准`} value={order.standardPrice} decimals={settings.decimals} />
        <PriceRow label={`${order.plainSymbol}容易成交`} value={order.easyPrice} decimals={settings.decimals} />
        <PriceRow label={`${order.plainSymbol}捡漏`} value={order.bargainPrice} decimals={settings.decimals} />
        {settings.showLeveraged ? (
          <PriceRow label={`${order.leveragedSymbol}参考`} value={order.leveragedPrice} decimals={settings.decimals} />
        ) : null}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3 text-sm">
        <span>距当前</span>
        <span className="font-mono text-white">{formatPercent(order.distancePercent)}</span>
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
      <div className="flex items-center gap-2">
        <span className="font-mono text-white">{formatted}</span>
        <CopyButton value={formatted} label="复制价格" compact />
      </div>
    </div>
  );
}
