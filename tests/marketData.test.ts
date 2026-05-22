import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchMarketQuotes, parseStooqQuoteXml } from "@/lib/marketData";

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

  it("parses Stooq GC.F and SI.F quote XML", () => {
    const quotes = parseStooqQuoteXml(`
      <stooq>
        <data>
          <symbol>
            <id>GC.F</id>
            <date>20260522</date>
            <time>173000</time>
            <close>4601.5</close>
          </symbol>
          <symbol>
            <id>SI.F</id>
            <date>20260522</date>
            <time>173000</time>
            <close>72.25</close>
          </symbol>
        </data>
      </stooq>
    `);

    expect(quotes).toEqual([
      {
        stooqSymbol: "GC.F",
        quoteSymbol: "GC",
        price: 4601.5,
        updatedAt: "2026-05-22T17:30:00+01:00"
      },
      {
        stooqSymbol: "SI.F",
        quoteSymbol: "SI",
        price: 72.25,
        updatedAt: "2026-05-22T17:30:00+01:00"
      }
    ]);
  });

  it("returns mixed payload when Stooq futures and Twelve Data ETFs both succeed", async () => {
    process.env.MARKET_DATA_API_KEY = "test-etf-key";

    vi.stubGlobal("fetch", vi.fn(async (input: URL | RequestInfo) => {
      const url = input.toString();

      if (url.includes("stooq.pl")) {
        return textResponse(`
          <stooq>
            <data>
              <symbol><id>GC.F</id><date>20260522</date><time>173000</time><close>4601.5</close></symbol>
              <symbol><id>SI.F</id><date>20260522</date><time>173000</time><close>72.25</close></symbol>
            </data>
          </stooq>
        `);
      }

      return jsonResponse({
        IAU: { symbol: "IAU", close: "86.55", percent_change: "0.1", datetime: "2026-05-21 09:30:00" },
        UGL: { symbol: "UGL", close: "58.10", percent_change: "0.2", datetime: "2026-05-21 09:30:00" },
        SLV: { symbol: "SLV", close: "65.80", percent_change: "-0.1", datetime: "2026-05-21 09:30:00" },
        AGQ: { symbol: "AGQ", close: "145.26", percent_change: "-0.2", datetime: "2026-05-21 09:30:00" }
      });
    }));

    const payload = await fetchMarketQuotes();
    const stooqUrls = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls
      .map(([input]) => input.toString())
      .filter((url: string) => url.includes("stooq.pl"));

    expect(payload.source).toBe("mixed");
    expect(payload.isMock).toBe(false);
    expect(payload.sources).toEqual({ comex: "stooq", etf: "twelvedata" });
    expect(payload.warning).toBeUndefined();
    expect(payload.quotes.GC?.price).toBe(4601.5);
    expect(payload.quotes.SI?.price).toBe(72.25);
    expect(payload.items?.comexGold.price).toBe(4601.5);
    expect(payload.items?.AGQ.price).toBe(145.26);
    expect(stooqUrls).toHaveLength(1);
    expect(new URL(stooqUrls[0]).searchParams.get("s")).toBe("GC.F SI.F");
    expect(new URL(stooqUrls[0]).searchParams.get("e")).toBe("xml");
  });

  it("falls back to mock when Stooq futures source fails", async () => {
    process.env.MARKET_DATA_API_KEY = "test-etf-key";

    vi.stubGlobal("fetch", vi.fn(async (input: URL | RequestInfo) => {
      const url = input.toString();
      if (url.includes("stooq.pl")) {
        return {
          ok: false,
          status: 400,
          text: async () => "bad request",
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

      if (url.includes("stooq.pl")) {
        return textResponse(`
          <stooq>
            <data>
              <symbol><id>GC.F</id><date>20260522</date><time>173000</time><close>4601.5</close></symbol>
              <symbol><id>SI.F</id><date>20260522</date><time>173000</time><close>72.25</close></symbol>
            </data>
          </stooq>
        `);
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

function textResponse(data: string) {
  return {
    ok: true,
    status: 200,
    text: async () => data
  };
}
