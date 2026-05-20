"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { GoldResultCard } from "@/components/GoldResultCard";
import { PointInput } from "@/components/PointInput";
import { QuotePanel } from "@/components/QuotePanel";
import { RiskNotice } from "@/components/RiskNotice";
import { SettingsPanel } from "@/components/SettingsPanel";
import { SilverResultCard } from "@/components/SilverResultCard";
import { buildConvertedOrder, calculateTakeProfit, isValidLongSetup } from "@/lib/formulas";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import type { ConvertedOrder, OrderSettings, QuoteMap, QuotePayload } from "@/lib/types";

type PointState = {
  entry: string;
  stop: string;
};

export default function Home() {
  const [quotes, setQuotes] = useState<QuoteMap>({});
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [quoteError, setQuoteError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<OrderSettings>(DEFAULT_SETTINGS);
  const [goldPoints, setGoldPoints] = useState<PointState>({ entry: "", stop: "" });
  const [silverPoints, setSilverPoints] = useState<PointState>({ entry: "", stop: "" });

  const refreshQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/quotes", { cache: "no-store" });
      const payload = await response.json() as QuotePayload;
      setQuotes(payload.quotes);
      setUpdatedAt(payload.updatedAt);
      setQuoteError(payload.error);
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
    if (settings.refreshIntervalMinutes <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      void refreshQuotes();
    }, settings.refreshIntervalMinutes * 60 * 1000);

    return () => window.clearInterval(timer);
  }, [refreshQuotes, settings.refreshIntervalMinutes]);

  const gold = usePointOrders("gold", goldPoints, quotes, settings);
  const silver = usePointOrders("silver", silverPoints, quotes, settings);

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-5 sm:px-6 lg:px-8">
      <header className="border-b border-line pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">COMEX Long Only</p>
        <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">COMEX金银挂单换算器</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-silver">
          输入 COMEX 黄金或白银买点与止损，自动生成 1:2 止盈并换算 IAU、UGL、SLV、AGQ 挂单参考价。
        </p>
      </header>

      <QuotePanel
        quotes={quotes}
        updatedAt={updatedAt}
        error={quoteError}
        loading={loading}
        onRefresh={refreshQuotes}
      />

      <PointInput
        metal="gold"
        entry={goldPoints.entry}
        stop={goldPoints.stop}
        takeProfit={gold.takeProfit}
        isValid={gold.isValid}
        onEntryChange={(entry) => setGoldPoints((current) => ({ ...current, entry }))}
        onStopChange={(stop) => setGoldPoints((current) => ({ ...current, stop }))}
      />
      <ResultGrid orders={gold.orders} settings={settings} metal="gold" />

      <PointInput
        metal="silver"
        entry={silverPoints.entry}
        stop={silverPoints.stop}
        takeProfit={silver.takeProfit}
        isValid={silver.isValid}
        onEntryChange={(entry) => setSilverPoints((current) => ({ ...current, entry }))}
        onStopChange={(stop) => setSilverPoints((current) => ({ ...current, stop }))}
      />
      <ResultGrid orders={silver.orders} settings={settings} metal="silver" />

      <SettingsPanel settings={settings} onChange={setSettings} />
      <RiskNotice />
    </main>
  );
}

function usePointOrders(
  metal: "gold" | "silver",
  points: PointState,
  quotes: QuoteMap,
  settings: OrderSettings
) {
  return useMemo(() => {
    const entry = toNumber(points.entry);
    const stop = toNumber(points.stop);
    const isValid = isValidLongSetup(entry, stop);

    if (!isValid || entry === null || stop === null) {
      return {
        isValid: !points.entry || !points.stop || isValid,
        takeProfit: null,
        orders: [] as ConvertedOrder[]
      };
    }

    const takeProfit = calculateTakeProfit(entry, stop);
    const orderPoints = [
      ["entry", entry],
      ["stop", stop],
      ["target", takeProfit]
    ] as const;

    return {
      isValid: true,
      takeProfit,
      orders: orderPoints
        .map(([pointKind, point]) => buildConvertedOrder(
          metal,
          pointKind,
          point,
          quotes,
          settings.easyPercent,
          settings.bargainPercent
        ))
        .filter((order): order is ConvertedOrder => order !== null)
    };
  }, [metal, points.entry, points.stop, quotes, settings.easyPercent, settings.bargainPercent]);
}

function ResultGrid({
  orders,
  settings,
  metal
}: {
  orders: ConvertedOrder[];
  settings: OrderSettings;
  metal: "gold" | "silver";
}) {
  if (orders.length === 0) {
    return (
      <div className="mb-2 rounded-md border border-line bg-panel px-4 py-5 text-sm text-silver">
        输入有效买点、止损并刷新到完整行情后显示换算结果。
      </div>
    );
  }

  return (
    <div className="grid gap-3 pb-6 md:grid-cols-3">
      {orders.map((order) => (
        metal === "gold" ? (
          <GoldResultCard key={`${order.metal}-${order.pointKind}`} order={order} settings={settings} />
        ) : (
          <SilverResultCard key={`${order.metal}-${order.pointKind}`} order={order} settings={settings} />
        )
      ))}
    </div>
  );
}

function toNumber(value: string): number | null {
  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  const number = Number(normalized);
  return Number.isFinite(number) && number > 0 ? number : null;
}
