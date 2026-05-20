"use client";

import type { QuoteMap } from "@/lib/types";
import { formatPercent, formatPrice } from "@/lib/format";

type QuotePanelProps = {
  quotes: QuoteMap;
  updatedAt: string | null;
  error?: string;
  loading: boolean;
  onRefresh: () => void;
};

const ORDER = ["GC", "SI", "IAU", "UGL", "SLV", "AGQ"] as const;

export function QuotePanel({ quotes, updatedAt, error, loading, onRefresh }: QuotePanelProps) {
  return (
    <section className="py-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-white">当前行情</h2>
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
          return (
            <div key={symbol} className="rounded-md border border-line bg-panel p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-sm text-silver">{quote?.name ?? symbol}</span>
                {quote?.changePercent !== undefined ? (
                  <span className={quote.changePercent >= 0 ? "text-xs text-gold" : "text-xs text-danger"}>
                    {formatPercent(quote.changePercent)}
                  </span>
                ) : null}
              </div>
              <div className="font-mono text-xl text-white">
                {quote ? formatPrice(quote.price, symbol === "GC" || symbol === "SI" ? 2 : 2) : "--"}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-col gap-2 text-xs text-silver/75 sm:flex-row sm:items-center sm:justify-between">
        <span>更新时间：{updatedAt ? new Date(updatedAt).toLocaleString("zh-CN") : "暂无"}</span>
        {error ? <span className="text-amber">行情不可用：{error}</span> : null}
      </div>
    </section>
  );
}
