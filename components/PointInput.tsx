"use client";

import type { Metal } from "@/lib/types";

type PointInputProps = {
  metal: Metal;
  points: string;
  recognizedCount: number;
  ignoredCount: number;
  onPointsChange: (value: string) => void;
  onClear: () => void;
};

export function PointInput({ metal, points, recognizedCount, ignoredCount, onPointsChange, onClear }: PointInputProps) {
  const label = metal === "gold" ? "COMEX 黄金点位" : "COMEX 白银点位";
  const accent = metal === "gold" ? "text-gold" : "text-silver";
  const placeholder =
    metal === "gold"
      ? "粘贴点位：4531 4520、4510"
      : "粘贴点位：76.05 75.8、75";

  return (
    <section className="border-t border-line py-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${accent}`}>COMEX</p>
          <h2 className="mt-1 text-xl font-semibold text-white">{label}</h2>
          <p className="mt-1 text-sm text-silver">支持换行、空格、逗号、顿号分隔。</p>
        </div>
        {points ? (
          <button
            type="button"
            onClick={onClear}
            className="min-h-9 rounded-md border border-line bg-panel px-3 text-sm text-silver transition hover:border-gold hover:text-white"
          >
            清空
          </button>
        ) : null}
      </div>

      <textarea
        inputMode="decimal"
        value={points}
        onChange={(event) => onPointsChange(event.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full rounded-md border border-line bg-panel px-4 py-3 font-mono text-lg text-white placeholder:text-silver/35 focus:border-gold focus:outline-none"
      />

      <div className="mt-2 flex flex-wrap gap-2 text-xs">
        <span className="rounded-md border border-line bg-ink/60 px-2 py-1 text-silver">
          已识别 {recognizedCount} 个点位
        </span>
        {ignoredCount > 0 ? (
          <span className="rounded-md border border-amber/40 bg-amber/10 px-2 py-1 text-amber">
            忽略 {ignoredCount} 项
          </span>
        ) : null}
      </div>
    </section>
  );
}
