"use client";

import { useState } from "react";
import { formatPercent, formatPrice, getMainOrderPrice } from "@/lib/format";
import type { ConvertedOrder, OrderSettings } from "@/lib/types";

type ResultCardProps = {
  order: ConvertedOrder;
  settings: OrderSettings;
  accent: "gold" | "silver";
  selected?: boolean;
  onCopy?: () => void;
};

export function ResultCard({ order, settings, accent, selected = false, onCopy = () => undefined }: ResultCardProps) {
  const [copied, setCopied] = useState(false);
  const plainPrice = getMainOrderPrice(order);
  const plainPriceFormatted = formatPrice(plainPrice, settings.decimals);
  const leveragedPriceFormatted = formatPrice(order.leveragedPrice, settings.decimals);

  const riskClass =
    order.riskLevel === "danger"
      ? "border-danger bg-danger/10 text-red-100"
      : order.riskLevel === "warning"
        ? "border-amber bg-amber/10 text-[#f7d99b]"
        : selected
          ? "border-gold bg-gold/10 text-silver"
          : "border-line bg-panel text-silver";
  const copiedClass = copied ? "border-gold bg-gold/15" : "";

  async function handleCardCopy() {
    await copyText(plainPriceFormatted);
    setCopied(true);
    onCopy();
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <article
      onClick={handleCardCopy}
      aria-label={`复制 ${order.plainSymbol} 挂单价 ${plainPriceFormatted}`}
      className={`cursor-pointer rounded-md border ${riskClass} ${copiedClass} p-4 shadow-glow transition active:scale-[0.99] active:border-gold active:bg-gold/15 hover:border-gold/70`}
    >
      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
        <div className="min-w-0">
          <p className={accent === "gold" ? "text-xs font-semibold text-gold" : "text-xs font-semibold text-silver/90"}>
            {order.metal === "gold" ? "COMEX黄金" : "COMEX白银"}
          </p>
          <p className="mt-1 truncate font-mono text-[2rem] font-semibold leading-none text-white">{order.point}</p>
        </div>
        <span className="pb-1 text-xl text-silver">→</span>
        <div className="min-w-0 text-right">
          <p className="text-xs font-semibold text-white">{order.plainSymbol}挂单</p>
          <p className="mt-1 truncate font-mono text-[2rem] font-semibold leading-none text-gold">
            {plainPriceFormatted}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-2 gap-y-1 text-sm text-silver">
        <span>距当前 {formatPercent(order.distancePercent)}</span>
      </div>

      <div className="mt-3 grid gap-2">
        {settings.showLeveraged ? (
          <div className="flex min-h-11 items-center rounded-md border border-line bg-ink/60 px-3">
            <span className="text-sm text-silver">{order.leveragedSymbol}参考 {leveragedPriceFormatted}</span>
          </div>
        ) : null}
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

async function copyText(value: string) {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(value);
    } else {
      fallbackCopy(value);
    }
  } catch {
    fallbackCopy(value);
  }
}

function fallbackCopy(value: string) {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}
