import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchMarketQuotes } from "@/lib/marketData";

const ORIGINAL_ENV = { ...process.env };

describe("marketData", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    process.env = { ...ORIGINAL_ENV };
  });

  it("returns mock payload when ETF API key is not configured", async () => {
    delete process.env.MARKET_DATA_API_KEY;

    const payload = await fetchMarketQuotes();

    expect(payload.source).toBe("mock");
    expect(payload.isMock).toBe(true);
    expect(payload.warning).toContain("MARKET_DATA_API_KEY");
    expect(payload.items?.IAU.price).toBeGreaterThan(0);
  });

  it("returns mixed payload when Yahoo Finance futures and Twelve Data ETFs both succeed", async () => {
    process.env.MARKET_DATA_API_KEY = "test-etf-key";

    vi.stubGlobal("fetch", vi.fn(async (input: URL | RequestInfo) => {
      const url = input.toString();

      if (url.includes("query1.finance.yahoo.com")) {
        return jsonResponse({
          quoteResponse: {
            result: [
              { symbol: "GC=F", regularMarketPrice: 4601.5, regularMarketChangePercent: 0.25, regularMarketTime: 1_779_343_200 },
              { symbol: "SI=F", regularMarketPrice: 72.25, regularMarketChangePercent: -0.15, regularMarketTime: 1_779_343_200 }
            ]
          }
        });
      }

      return jsonResponse({
        IAU: { symbol: "IAU", close: "86.55", percent_change: "0.1", datetime: "2026-05-21 09:30:00" },
        UGL: { symbol: "UGL", close: "58.10", percent_change: "0.2", datetime: "2026-05-21 09:30:00" },
        SLV: { symbol: "SLV", close: "65.80", percent_change: "-0.1", datetime: "2026-05-21 09:30:00" },
        AGQ: { symbol: "AGQ", close: "145.26", percent_change: "-0.2", datetime: "2026-05-21 09:30:00" }
      });
    }));

    const payload = await fetchMarketQuotes();
    const yahooUrls = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls
      .map(([input]) => input.toString())
      .filter((url: string) => url.includes("query1.finance.yahoo.com"));

    expect(payload.source).toBe("mixed");
    expect(payload.isMock).toBe(false);
    expect(payload.sources).toEqual({ comex: "yahoo-finance", etf: "twelvedata" });
    expect(payload.warning).toBeUndefined();
    expect(payload.quotes.GC?.price).toBe(4601.5);
    expect(payload.quotes.SI?.price).toBe(72.25);
    expect(payload.items?.comexGold.price).toBe(4601.5);
    expect(payload.items?.AGQ.price).toBe(145.26);
    expect(yahooUrls).toHaveLength(1);
    expect(new URL(yahooUrls[0]).searchParams.get("symbols")).toBe("GC=F,SI=F");
  });

  it("falls back to mock when Yahoo Finance futures source fails", async () => {
    process.env.MARKET_DATA_API_KEY = "test-etf-key";

    vi.stubGlobal("fetch", vi.fn(async (input: URL | RequestInfo) => {
      const url = input.toString();
      if (url.includes("query1.finance.yahoo.com")) {
        return {
          ok: false,
          status: 400,
          text: async () => "{\"finance\":{\"error\":\"bad request\"}}",
          json: async () => ({})
        };
      }
      return jsonResponse({});
    }));

    const payload = await fetchMarketQuotes();

    expect(payload.source).toBe("mock");
    expect(payload.isMock).toBe(true);
    expect(payload.warning).toContain("COMEX futures 延迟行情源请求失败");
    expect(payload.warning).toContain("HTTP 400");
    expect(payload.warning).toContain("bad request");
  });

  it("falls back to mock when any ETF quote is missing", async () => {
    process.env.MARKET_DATA_API_KEY = "test-etf-key";

    vi.stubGlobal("fetch", vi.fn(async (input: URL | RequestInfo) => {
      const url = input.toString();

      if (url.includes("query1.finance.yahoo.com")) {
        return jsonResponse({
          quoteResponse: {
            result: [
              { symbol: "GC=F", regularMarketPrice: 4601.5, regularMarketTime: 1_779_343_200 },
              { symbol: "SI=F", regularMarketPrice: 72.25, regularMarketTime: 1_779_343_200 }
            ]
          }
        });
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
