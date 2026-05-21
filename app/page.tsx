"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PointInput } from "@/components/PointInput";
import { QuotePanel } from "@/components/QuotePanel";
import { ResultCard } from "@/components/ResultCard";
import { RiskNotice } from "@/components/RiskNotice";
import { SettingsPanel } from "@/components/SettingsPanel";
import { buildConvertedOrder } from "@/lib/formulas";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import type { ConvertedOrder, OrderSettings, QuoteMap, QuotePayload } from "@/lib/types";

export default function Home() {
  const [quotes, setQuotes] = useState<QuoteMap>({});
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [quoteError, setQuoteError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<QuotePayload["source"]>("mock");
  const [settings, setSettings] = useState<OrderSettings>(DEFAULT_SETTINGS);
  const [goldPoints, setGoldPoints] = useState("");
  const [silverPoints, setSilverPoints] = useState("");

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
    if (settings.refreshIntervalMinutes <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      void refreshQuotes();
    }, settings.refreshIntervalMinutes * 60 * 1000);

    return () => window.clearInterval(timer);
  }, [refreshQuotes, settings.refreshIntervalMinutes]);

  const goldOrders = usePointOrders("gold", goldPoints, quotes, settings);
  const silverOrders = usePointOrders("silver", silverPoints, quotes, settings);

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-5 sm:px-6 lg:px-8">
      <header className="border-b border-line pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">COMEX ETF</p>
        <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">COMEX金银点位换算器</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-silver">
          输入 COMEX 黄金或白银点位，自动换算 IAU、UGL、SLV、AGQ 挂单参考价。
        </p>
      </header>

      <QuotePanel
        quotes={quotes}
        updatedAt={updatedAt}
        error={quoteError}
        loading={loading}
        onRefresh={refreshQuotes}
        isMock={source === "mock"}
      />

      <PointInput metal="gold" points={goldPoints} onPointsChange={setGoldPoints} />
      <ResultList orders={goldOrders} settings={settings} metal="gold" />

      <PointInput metal="silver" points={silverPoints} onPointsChange={setSilverPoints} />
      <ResultList orders={silverOrders} settings={settings} metal="silver" />

      <SettingsPanel settings={settings} onChange={setSettings} />
      <RiskNotice />
    </main>
  );
}

function usePointOrders(
  metal: "gold" | "silver",
  points: string,
  quotes: QuoteMap,
  settings: OrderSettings
) {
  return useMemo(() => {
    const lines = points.split("\n");
    const orders: ConvertedOrder[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        continue;
      }

      const number = Number(trimmed);
      if (!Number.isFinite(number) || number <= 0) {
        continue;
      }

      const order = buildConvertedOrder(metal, number, quotes, settings.easyPercent, settings.bargainPercent);
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
  metal
}: {
  orders: ConvertedOrder[];
  settings: OrderSettings;
  metal: "gold" | "silver";
}) {
  if (orders.length === 0) {
    return (
      <div className="mb-2 rounded-md border border-line bg-panel px-4 py-5 text-sm text-silver">
        输入点位并成功加载行情后，自动显示换算结果。
      </div>
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
        />
      ))}
    </div>
  );
}
