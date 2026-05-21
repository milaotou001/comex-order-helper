import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchMarketQuotes } from "@/lib/marketData";

const ORIGINAL_ENV = { ...process.env };

describe("marketData", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    process.env = { ...ORIGINAL_ENV };
  });

  it("returns mock payload when API key is not configured", async () => {
    delete process.env.MARKET_DATA_API_KEY;

    const payload = await fetchMarketQuotes();

    expect(payload.source).toBe("mock");
    expect(payload.isMock).toBe(true);
    expect(payload.warning).toContain("未配置 MARKET_DATA_API_KEY");
    expect(payload.quotes.IAU?.price).toBeGreaterThan(0);
  });

  it("requires COMEX symbols to come from environment variables", async () => {
    process.env.MARKET_DATA_API_KEY = "test-key";
    delete process.env.COMEX_GOLD_SYMBOL;
    delete process.env.COMEX_SILVER_SYMBOL;

    const payload = await fetchMarketQuotes();

    expect(payload.source).toBe("mock");
    expect(payload.isMock).toBe(true);
    expect(payload.warning).toContain("COMEX_GOLD_SYMBOL");
    expect(payload.warning).toContain("COMEX_SILVER_SYMBOL");
  });

  it("normalizes a complete Twelve Data quote response", async () => {
    process.env.MARKET_DATA_API_KEY = "test-key";
    process.env.COMEX_GOLD_SYMBOL = "TD_GOLD_SYMBOL";
    process.env.COMEX_SILVER_SYMBOL = "TD_SILVER_SYMBOL";

    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      json: async () => ({
        TD_GOLD_SYMBOL: { symbol: "TD_GOLD_SYMBOL", close: "4601.5", percent_change: "0.25", datetime: "2026-05-21 09:30:00" },
        TD_SILVER_SYMBOL: { symbol: "TD_SILVER_SYMBOL", close: "72.25", percent_change: "-0.15", datetime: "2026-05-21 09:30:00" },
        IAU: { symbol: "IAU", close: "86.55", percent_change: "0.1", datetime: "2026-05-21 09:30:00" },
        UGL: { symbol: "UGL", close: "58.10", percent_change: "0.2", datetime: "2026-05-21 09:30:00" },
        SLV: { symbol: "SLV", close: "65.80", percent_change: "-0.1", datetime: "2026-05-21 09:30:00" },
        AGQ: { symbol: "AGQ", close: "145.26", percent_change: "-0.2", datetime: "2026-05-21 09:30:00" }
      })
    })));

    const payload = await fetchMarketQuotes();

    expect(payload.source).toBe("twelvedata");
    expect(payload.isMock).toBe(false);
    expect(payload.warning).toBeUndefined();
    expect(payload.quotes.GC?.price).toBe(4601.5);
    expect(payload.quotes.SI?.price).toBe(72.25);
  });

  it("falls back to mock when any required quote is missing", async () => {
    process.env.MARKET_DATA_API_KEY = "test-key";
    process.env.COMEX_GOLD_SYMBOL = "TD_GOLD_SYMBOL";
    process.env.COMEX_SILVER_SYMBOL = "TD_SILVER_SYMBOL";

    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      json: async () => ({
        TD_GOLD_SYMBOL: { symbol: "TD_GOLD_SYMBOL", close: "4601.5" }
      })
    })));

    const payload = await fetchMarketQuotes();

    expect(payload.source).toBe("mock");
    expect(payload.isMock).toBe(true);
    expect(payload.warning).toContain("真实行情缺少有效价格");
  });
});
