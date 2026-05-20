"use client";

import type { Metal } from "@/lib/types";

type PointInputProps = {
  metal: Metal;
  entry: string;
  stop: string;
  takeProfit: number | null;
  isValid: boolean;
  onEntryChange: (value: string) => void;
  onStopChange: (value: string) => void;
};

export function PointInput({
  metal,
  entry,
  stop,
  takeProfit,
  isValid,
  onEntryChange,
  onStopChange
}: PointInputProps) {
  const label = metal === "gold" ? "COMEX 黄金" : "COMEX 白银";
  const accent = metal === "gold" ? "text-gold" : "text-silver";

  return (
    <section className="border-t border-line py-6">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${accent}`}>只做多</p>
          <h2 className="mt-1 text-xl font-semibold text-white">{label}</h2>
        </div>
        <div className="rounded-md border border-line px-3 py-2 text-right text-xs text-silver">
          <span className="block text-[11px] text-silver/70">盈亏比</span>
          <span className="font-mono text-white">1:2</span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="mb-2 block text-sm text-silver">买点</span>
          <input
            inputMode="decimal"
            value={entry}
            onChange={(event) => onEntryChange(event.target.value)}
            placeholder={metal === "gold" ? "4550" : "70"}
            className="h-12 w-full rounded-md border border-line bg-panel px-3 font-mono text-lg text-white placeholder:text-silver/35"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm text-silver">止损</span>
          <input
            inputMode="decimal"
            value={stop}
            onChange={(event) => onStopChange(event.target.value)}
            placeholder={metal === "gold" ? "4520" : "68"}
            className="h-12 w-full rounded-md border border-line bg-panel px-3 font-mono text-lg text-white placeholder:text-silver/35"
          />
        </label>
        <div>
          <span className="mb-2 block text-sm text-silver">自动止盈</span>
          <div className="flex h-12 items-center rounded-md border border-line bg-ink px-3 font-mono text-lg text-white">
            {takeProfit === null ? "等待输入" : takeProfit.toFixed(2)}
          </div>
        </div>
      </div>

      {entry && stop && !isValid ? (
        <p className="mt-3 rounded-md border border-danger/50 bg-danger/10 px-3 py-2 text-sm text-red-200">
          只支持做多，止损必须低于买点。
        </p>
      ) : null}
    </section>
  );
}
