"use client";

import type { Metal } from "@/lib/types";

type PointInputProps = {
  metal: Metal;
  points: string;
  onPointsChange: (value: string) => void;
};

export function PointInput({ metal, points, onPointsChange }: PointInputProps) {
  const label = metal === "gold" ? "COMEX 黄金点位" : "COMEX 白银点位";
  const accent = metal === "gold" ? "text-gold" : "text-silver";
  const placeholder =
    metal === "gold"
      ? "每行一个点位，例如：\n4500\n4450\n4400"
      : "每行一个点位，例如：\n73\n72\n70";

  return (
    <section className="border-t border-line py-6">
      <div className="mb-4">
        <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${accent}`}>COMEX</p>
        <h2 className="mt-1 text-xl font-semibold text-white">{label}</h2>
        <p className="mt-1 text-sm text-silver">输入 COMEX {metal === "gold" ? "黄金" : "白银"} 点位，自动换算 ETF 挂单参考价。</p>
      </div>

      <textarea
        inputMode="decimal"
        value={points}
        onChange={(event) => onPointsChange(event.target.value)}
        placeholder={placeholder}
        rows={5}
        className="w-full rounded-md border border-line bg-panel px-4 py-3 font-mono text-lg text-white placeholder:text-silver/35 focus:border-gold focus:outline-none"
      />
    </section>
  );
}
