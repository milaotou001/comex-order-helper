import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchMarketQuotes } from "@/lib/marketData";

const ORIGINAL_ENV = { ...process.env };

describe("marketData", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    process.env = { ...ORIGINAL_ENV };
  });

  it("returns mock payload when COMEX futures API key is not configured", async () => {
    delete process.env.COMMODITY_DATA_API_KEY;
    process.env.MARKET_DATA_API_KEY = "test-etf-key";

    const payload = await fetchMarketQuotes();

    expect(payload.source).toBe("mock");
    expect(payload.isMock).toBe(true);
    expect(payload.warning).toContain("COMMODITY_DATA_API_KEY");
    expect(payload.items?.comexGold.price).toBeGreaterThan(0);
  });

  it("returns mock payload when ETF API key is not configured", async () => {
    process.env.COMMODITY_DATA_API_KEY = "test-comex-key";
    delete process.env.MARKET_DATA_API_KEY;

    const payload = await fetchMarketQuotes();

    expect(payload.source).toBe("mock");
    expect(payload.isMock).toBe(true);
    expect(payload.warning).toContain("MARKET_DATA_API_KEY");
    expect(payload.items?.IAU.price).toBeGreaterThan(0);
  });

  it("returns mixed payload when API-Ninjas futures and Twelve Data ETFs both succeed", async () => {
    process.env.COMMODITY_DATA_API_KEY = "test-comex-key";
    process.env.MARKET_DATA_API_KEY = "test-etf-key";

    vi.stubGlobal("fetch", vi.fn(async (input: URL | RequestInfo) => {
      const url = input.toString();

      if (url.includes("api.api-ninjas.com") && url.includes("name=gold")) {
        return jsonResponse({ name: "Gold Futures", exchange: "CME", price: 4601.5, updated: 1_779_343_200 });
      }

      if (url.includes("api.api-ninjas.com") && url.includes("name=silver")) {
        return jsonResponse({ name: "Silver Futures", exchange: "CME", price: 72.25, updated: 1_779_343_200 });
      }

      return jsonResponse({
        IAU: { symbol: "IAU", close: "86.55", percent_change: "0.1", datetime: "2026-05-21 09:30:00" },
        UGL: { symbol: "UGL", close: "58.10", percent_change: "0.2", datetime: "2026-05-21 09:30:00" },
        SLV: { symbol: "SLV", close: "65.80", percent_change: "-0.1", datetime: "2026-05-21 09:30:00" },
        AGQ: { symbol: "AGQ", close: "145.26", percent_change: "-0.2", datetime: "2026-05-21 09:30:00" }
      });
    }));

    const payload = await fetchMarketQuotes();
    const apiNinjasUrls = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls
      .map(([input]) => input.toString())
      .filter((url: string) => url.includes("api.api-ninjas.com"));

    expect(payload.source).toBe("mixed");
    expect(payload.isMock).toBe(false);
    expect(payload.sources).toEqual({ comex: "api-ninjas", etf: "twelvedata" });
    expect(payload.warning).toBeUndefined();
    expect(payload.quotes.GC?.price).toBe(4601.5);
    expect(payload.quotes.SI?.price).toBe(72.25);
    expect(payload.items?.comexGold.price).toBe(4601.5);
    expect(payload.items?.AGQ.price).toBe(145.26);
    expect(apiNinjasUrls).toHaveLength(2);
    expect(apiNinjasUrls.some((url: string) => new URL(url).searchParams.get("name") === "gold")).toBe(true);
    expect(apiNinjasUrls.some((url: string) => new URL(url).searchParams.get("name") === "silver")).toBe(true);
    expect(apiNinjasUrls.some((url: string) => new URL(url).searchParams.get("name") === "GC")).toBe(false);
    expect(apiNinjasUrls.some((url: string) => new URL(url).searchParams.get("name") === "SI")).toBe(false);
  });

  it("falls back to mock when COMEX futures source fails", async () => {
    process.env.COMMODITY_DATA_API_KEY = "test-comex-key";
    process.env.MARKET_DATA_API_KEY = "test-etf-key";

    vi.stubGlobal("fetch", vi.fn(async (input: URL | RequestInfo) => {
      const url = input.toString();
      if (url.includes("api.api-ninjas.com")) {
        return { ok: false, status: 503, json: async () => ({}) };
      }
      return jsonResponse({});
    }));

    const payload = await fetchMarketQuotes();

    expect(payload.source).toBe("mock");
    expect(payload.isMock).toBe(true);
    expect(payload.warning).toContain("COMEX futures 源请求失败");
  });

  it("falls back to mock when any ETF quote is missing", async () => {
    process.env.COMMODITY_DATA_API_KEY = "test-comex-key";
    process.env.MARKET_DATA_API_KEY = "test-etf-key";

    vi.stubGlobal("fetch", vi.fn(async (input: URL | RequestInfo) => {
      const url = input.toString();

      if (url.includes("api.api-ninjas.com") && url.includes("name=gold")) {
        return jsonResponse({ name: "Gold Futures", exchange: "CME", price: 4601.5, updated: 1_779_343_200 });
      }

      if (url.includes("api.api-ninjas.com") && url.includes("name=silver")) {
        return jsonResponse({ name: "Silver Futures", exchange: "CME", price: 72.25, updated: 1_779_343_200 });
      }

      return jsonResponse({
        IAU: { symbol: "IAU", close: "86.55" }
      });
    }));

    const payload = await fetchMarketQuotes();

    expect(payload.source).toBe("mock");
    expect(payload.isMock).toBe(true);
    expect(payload.warning).toContain("真实行情缺少有效价格");
  });
});

function jsonResponse(data: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => data
  };
}
