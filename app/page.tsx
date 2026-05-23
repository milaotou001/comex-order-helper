"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PointInput } from "@/components/PointInput";
import { QuotePanel } from "@/components/QuotePanel";
import { ResultCard } from "@/components/ResultCard";
import { buildConvertedOrder } from "@/lib/formulas";
import { MOCK_QUOTES } from "@/lib/marketData";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import type { ConvertedOrder, Metal, OrderSettings, QuoteMap, QuotePayload } from "@/lib/types";

type ParsedPoints = {
  points: number[];
  ignoredCount: number;
};

type ThemeMode = "light" | "dark";

export default function Home() {
  const [quotes, setQuotes] = useState<QuoteMap>({});
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [quoteError, setQuoteError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<QuotePayload["source"]>("mock");
  const [settings] = useState<OrderSettings>(DEFAULT_SETTINGS);
  const [goldPoints, setGoldPoints] = useState("");
  const [silverPoints, setSilverPoints] = useState("");
  const [activeMetal, setActiveMetal] = useState<Metal>("gold");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [theme, setTheme] = useState<ThemeMode>("light");

  const refreshQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/quotes", { cache: "no-store" });
      const payload = await response.json() as QuotePayload;
      setQuotes(payload.quotes);
      setUpdatedAt(payload.updatedAt);
      setQuoteError(payload.warning ?? payload.error);
      setSource(payload.source);
    } catch {
      setQuoteError("无法连接行情接口");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshQuotes();
  }, [refreshQuotes]);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("comex-theme");
    if (savedTheme === "dark" || savedTheme === "light") {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("comex-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (settings.refreshIntervalMinutes <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      void refreshQuotes();
    }, settings.refreshIntervalMinutes * 60 * 1000);

    return () => window.clearInterval(timer);
  }, [refreshQuotes, settings.refreshIntervalMinutes]);

  const resolvedQuotes = useMemo(() => ({ ...MOCK_QUOTES, ...quotes }), [quotes]);
  const goldParsed = useMemo(() => parsePointInput(goldPoints), [goldPoints]);
  const silverParsed = useMemo(() => parsePointInput(silverPoints), [silverPoints]);
  const goldOrders = usePointOrders("gold", goldParsed.points, resolvedQuotes, settings);
  const silverOrders = usePointOrders("silver", silverParsed.points, resolvedQuotes, settings);
  const activeOrders = activeMetal === "gold" ? goldOrders : silverOrders;

  useEffect(() => {
    if (activeOrders.length === 0) {
      setSelectedKey(null);
      return;
    }

    if (!selectedKey || !activeOrders.some((order) => getOrderKey(order) === selectedKey)) {
      setSelectedKey(getOrderKey(activeOrders[0]));
    }
  }, [activeOrders, selectedKey]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 pb-28 pt-5 sm:px-6 lg:px-8">
      <header className="border-b border-line pb-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">COMEX ETF</p>
            <h1 className="mt-2 text-3xl font-semibold text-ink sm:text-4xl">COMEX金银点位换算器</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-silver">
              输入 COMEX 黄金或白银点位，自动换算 IAU、UGL、SLV、AGQ 挂单参考价。
            </p>
          </div>
          <ThemeToggle theme={theme} onChange={setTheme} />
        </div>
      </header>

      <QuotePanel
        quotes={quotes}
        updatedAt={updatedAt}
        error={quoteError}
        loading={loading}
        onRefresh={refreshQuotes}
        isMock={source === "mock"}
      />

      {activeMetal === "gold" ? (
        <>
          <PointInput
            metal="gold"
            points={goldPoints}
            recognizedCount={goldParsed.points.length}
            ignoredCount={goldParsed.ignoredCount}
            onPointsChange={setGoldPoints}
            onClear={() => setGoldPoints("")}
          />
          <ResultList
            orders={goldOrders}
            settings={settings}
            metal="gold"
            selectedKey={selectedKey}
            onSelect={setSelectedKey}
          />
        </>
      ) : null}

      {activeMetal === "silver" ? (
        <>
          <PointInput
            metal="silver"
            points={silverPoints}
            recognizedCount={silverParsed.points.length}
            ignoredCount={silverParsed.ignoredCount}
            onPointsChange={setSilverPoints}
            onClear={() => setSilverPoints("")}
          />
          <ResultList
            orders={silverOrders}
            settings={settings}
            metal="silver"
            selectedKey={selectedKey}
            onSelect={setSelectedKey}
          />
        </>
      ) : null}

      <MetalTabs activeMetal={activeMetal} onChange={setActiveMetal} />
    </main>
  );
}

function ThemeToggle({ theme, onChange }: { theme: ThemeMode; onChange: (theme: ThemeMode) => void }) {
  return (
    <div className="grid shrink-0 grid-cols-2 gap-1 rounded-md border border-line bg-panel p-1">
      <button
        type="button"
        aria-pressed={theme === "light"}
        onClick={() => onChange("light")}
        className={`min-h-9 rounded-md px-3 text-xs font-semibold transition ${
          theme === "light" ? "bg-gold text-ink" : "text-silver hover:text-ink"
        }`}
      >
        白
      </button>
      <button
        type="button"
        aria-pressed={theme === "dark"}
        onClick={() => onChange("dark")}
        className={`min-h-9 rounded-md px-3 text-xs font-semibold transition ${
          theme === "dark" ? "bg-gold text-ink" : "text-silver hover:text-ink"
        }`}
      >
        黑
      </button>
    </div>
  );
}

function MetalTabs({ activeMetal, onChange }: { activeMetal: Metal; onChange: (metal: Metal) => void }) {
  return (
    <section className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-page/95 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur">
      <div className="mx-auto w-full max-w-5xl">
        <p className="mb-2 text-center text-xs text-silver">点击卡片复制挂单价</p>
        <div className="grid grid-cols-2 gap-2 rounded-md border border-line bg-panel p-1">
        <button
          type="button"
          onClick={() => onChange("gold")}
          className={`min-h-12 rounded-md border px-3 text-sm font-semibold transition ${
            activeMetal === "gold"
              ? "border-gold bg-gold text-ink"
              : "border-transparent bg-transparent text-silver hover:border-gold/50 hover:text-ink"
          }`}
        >
          黄金 IAU / UGL
        </button>
        <button
          type="button"
          onClick={() => onChange("silver")}
          className={`min-h-12 rounded-md border px-3 text-sm font-semibold transition ${
            activeMetal === "silver"
              ? "border-gold bg-gold text-ink"
              : "border-transparent bg-transparent text-silver hover:border-gold/50 hover:text-ink"
          }`}
        >
          白银 SLV / AGQ
        </button>
        </div>
      </div>
    </section>
  );
}

function usePointOrders(
  metal: Metal,
  points: number[],
  quotes: QuoteMap,
  settings: OrderSettings
) {
  return useMemo(() => {
    const orders: ConvertedOrder[] = [];

    for (const point of points) {
      const order = buildConvertedOrder(metal, point, quotes, settings.easyPercent, settings.bargainPercent);
      if (order) {
        orders.push(order);
      }
    }

    return orders;
  }, [metal, points, quotes, settings.easyPercent, settings.bargainPercent]);
}

function ResultList({
  orders,
  settings,
  metal,
  selectedKey,
  onSelect
}: {
  orders: ConvertedOrder[];
  settings: OrderSettings;
  metal: Metal;
  selectedKey: string | null;
  onSelect: (key: string) => void;
}) {
  if (orders.length === 0) {
    return (
      null
    );
  }

  return (
    <div className="grid gap-3 pb-6 md:grid-cols-2 lg:grid-cols-3">
      {orders.map((order, index) => (
        <ResultCard
          key={`${order.metal}-${order.point}-${index}`}
          order={order}
          settings={settings}
          accent={metal}
          selected={getOrderKey(order) === selectedKey}
          onCopy={() => onSelect(getOrderKey(order))}
        />
      ))}
    </div>
  );
}

function parsePointInput(value: string): ParsedPoints {
  const normalized = value
    .replace(/[，,、；;|]/g, " ")
    .replace(/\r?\n/g, " ");
  const tokens = normalized.split(/\s+/).filter(Boolean);
  const points: number[] = [];
  let ignoredCount = 0;

  for (const token of tokens) {
    const number = Number(token);
    if (Number.isFinite(number) && number > 0) {
      points.push(number);
    } else {
      ignoredCount += 1;
    }
  }

  return { points, ignoredCount };
}

function getOrderKey(order: ConvertedOrder): string {
  return `${order.metal}-${order.point}`;
}
