import { afterEach, describe, expect, it, vi } from "vitest";
import type { QuotePayload } from "@/lib/types";

const LIVE_PAYLOAD: QuotePayload = {
  quotes: {
    GC: { symbol: "GC", name: "COMEX黄金", price: 4531.07, updatedAt: "2026-05-23T04:59:45+08:00" },
    SI: { symbol: "SI", name: "COMEX白银", price: 76.045, updatedAt: "2026-05-23T04:59:21+08:00" },
    IAU: { symbol: "IAU", name: "IAU", price: 86.55, updatedAt: "2026-05-23T05:00:00+08:00" },
    UGL: { symbol: "UGL", name: "UGL", price: 58.1, updatedAt: "2026-05-23T05:00:00+08:00" },
    SLV: { symbol: "SLV", name: "SLV", price: 65.8, updatedAt: "2026-05-23T05:00:00+08:00" },
    AGQ: { symbol: "AGQ", name: "AGQ", price: 145.26, updatedAt: "2026-05-23T05:00:00+08:00" }
  },
  items: {
    comexGold: { symbol: "GC", name: "COMEX黄金", price: 4531.07, updatedAt: "2026-05-23T04:59:45+08:00" },
    comexSilver: { symbol: "SI", name: "COMEX白银", price: 76.045, updatedAt: "2026-05-23T04:59:21+08:00" },
    IAU: { symbol: "IAU", name: "IAU", price: 86.55, updatedAt: "2026-05-23T05:00:00+08:00" },
    UGL: { symbol: "UGL", name: "UGL", price: 58.1, updatedAt: "2026-05-23T05:00:00+08:00" },
    SLV: { symbol: "SLV", name: "SLV", price: 65.8, updatedAt: "2026-05-23T05:00:00+08:00" },
    AGQ: { symbol: "AGQ", name: "AGQ", price: 145.26, updatedAt: "2026-05-23T05:00:00+08:00" }
  },
  updatedAt: "2026-05-23T04:59:45+08:00",
  source: "mixed",
  sources: { comex: "sina", etf: "twelvedata" },
  isMock: false
};

const MOCK_PAYLOAD: QuotePayload = {
  quotes: LIVE_PAYLOAD.quotes,
  items: LIVE_PAYLOAD.items,
  updatedAt: "2026-05-23T05:10:00+08:00",
  source: "mock",
  isMock: true,
  warning: "ETFs unavailable",
  error: "ETFs unavailable"
};

describe("sharedQuoteCache", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("deduplicates concurrent refreshes into one upstream call", async () => {
    vi.resetModules();

    const fetchMarketQuotes = vi.fn(async () => LIVE_PAYLOAD);
    vi.doMock("@/lib/marketData", () => ({
      fetchMarketQuotes
    }));

    const { getSharedQuotePayload, resetSharedQuoteCacheForTests } = await import("@/lib/sharedQuoteCache");
    resetSharedQuoteCacheForTests();

    const [first, second] = await Promise.all([getSharedQuotePayload(), getSharedQuotePayload()]);

    expect(fetchMarketQuotes).toHaveBeenCalledTimes(1);
    expect(first).toBe(second);
    expect(first.source).toBe("mixed");
  });

  it("keeps the last successful payload when refresh falls back to mock", async () => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-23T06:00:00+08:00"));

    const fetchMarketQuotes = vi.fn(async () => MOCK_PAYLOAD);
    vi.doMock("@/lib/marketData", () => ({
      fetchMarketQuotes
    }));

    const {
      getSharedQuotePayload,
      primeSharedQuoteCacheForTests,
      resetSharedQuoteCacheForTests
    } = await import("@/lib/sharedQuoteCache");

    resetSharedQuoteCacheForTests();
    primeSharedQuoteCacheForTests(LIVE_PAYLOAD, {
      storedAt: new Date("2026-05-23T05:40:00+08:00").getTime(),
      expiresAt: new Date("2026-05-23T05:41:00+08:00").getTime()
    });

    const payload = await getSharedQuotePayload();

    expect(fetchMarketQuotes).toHaveBeenCalledTimes(1);
    expect(payload.source).toBe("mixed");
    expect(payload.isMock).toBe(false);
    expect(payload.warning).toContain("ETFs unavailable");
  });
});
