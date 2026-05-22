"use client";

import type { QuoteMap } from "@/lib/types";
import { formatPrice } from "@/lib/format";

type QuotePanelProps = {
  quotes: QuoteMap;
  updatedAt: string | null;
  error?: string;
  loading: boolean;
  onRefresh: () => void;
  isMock: boolean;
};

const ORDER = ["GC", "SI", "IAU", "UGL", "SLV", "AGQ"] as const;

export function QuotePanel({ quotes, updatedAt, error, loading, onRefresh, isMock }: QuotePanelProps) {
  const updatedLabel = updatedAt ? formatUpdatedDistance(updatedAt) : "暂无";

  return (
    <section className="py-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">当前行情</h2>
          {isMock ? (
            <span className="rounded-md border border-amber/50 bg-amber/10 px-2 py-0.5 text-xs text-amber">
              mock 行情（仅用于 MVP-0 验收）
            </span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="h-10 rounded-md border border-gold/50 bg-gold px-4 text-sm font-semibold text-ink transition hover:bg-[#e2bd68] disabled:cursor-wait disabled:opacity-60"
        >
          {loading ? "刷新中" : "刷新"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {ORDER.map((symbol) => {
          const quote = quotes[symbol];
          const isComex = symbol === "GC" || symbol === "SI";
          return (
            <div
              key={symbol}
              className={`rounded-md border bg-panel p-3 ${
                isComex ? "border-gold/30" : "border-line"
              }`}
            >
              <p className={`text-xs ${isComex ? "text-gold" : "text-silver"}`}>
                {quote?.name ?? symbol}
              </p>
              <p className={`mt-1 font-mono text-lg ${isComex ? "text-white" : "text-silver"}`}>
                {quote ? formatPrice(quote.price, 2) : "--"}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex items-center gap-x-3 text-xs">
        <span className={isMock ? "text-amber" : "text-gold"}>{isMock ? "mock" : "真实"}</span>
        <span className="text-silver">更新 {updatedLabel}</span>
      </div>

      <div className="mt-3 flex flex-col gap-2 text-xs text-silver/75 sm:flex-row sm:items-center sm:justify-between">
        {error ? <span className="text-amber">{error}</span> : null}
      </div>
    </section>
  );
}

function formatUpdatedDistance(updatedAt: string): string {
  const timestamp = new Date(updatedAt).getTime();
  if (!Number.isFinite(timestamp)) {
    return "暂无";
  }

  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) {
    return `${seconds}秒前`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}分钟前`;
  }

  return new Date(updatedAt).toLocaleString("zh-CN");
}
