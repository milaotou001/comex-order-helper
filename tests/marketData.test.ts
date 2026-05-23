import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchMarketQuotes, parseStooqQuoteHtml } from "@/lib/marketData";

const ORIGINAL_ENV = { ...process.env };

describe("marketData", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    process.env = { ...ORIGINAL_ENV };
  });

  it("returns mixed payload with ETF warning when ETF API key is not configured", async () => {
    delete process.env.MARKET_DATA_API_KEY;

    vi.stubGlobal("fetch", vi.fn(async (input: URL | RequestInfo) => {
      const url = input.toString();
      if (url.includes("hq.sinajs.cn")) {
        return textResponse(sinaResponse(4601.5, 72.25));
      }
      return jsonResponse({});
    }));

    const payload = await fetchMarketQuotes();

    expect(payload.source).toBe("mixed");
    expect(payload.isMock).toBe(false);
    expect(payload.sources).toEqual({ comex: "sina", etf: "twelvedata" });
    expect(payload.warning).toContain("部分 ETF 行情缺失");
    expect(payload.items).toBeUndefined();
  });

  it("parses GC.F price from Stooq quote page HTML", () => {
    const quote = parseStooqQuoteHtml(`
      <html><body>
        <h1>Gold (GC.F)</h1>
        <div>22 maj , 14:15 4531.07 -11.43 (-0.25%)</div>
      </body></html>
    `, "GC.F", "GC");

    expect(quote.stooqSymbol).toBe("GC.F");
    expect(quote.quoteSymbol).toBe("GC");
    expect(quote.rawPrice).toBe(4531.07);
    expect(quote.price).toBe(4531.07);
  });

  it("parses and normalizes SI.F price from Stooq quote page HTML", () => {
    const quote = parseStooqQuoteHtml(`
      <html><body>
        <h1>Silver (SI.F)</h1>
        <div>22 maj , 14:15 7604.500 -10.000 (-0.13%)</div>
      </body></html>
    `, "SI.F", "SI");

    expect(quote.stooqSymbol).toBe("SI.F");
    expect(quote.quoteSymbol).toBe("SI");
    expect(quote.rawPrice).toBe(7604.5);
    expect(quote.price).toBe(76.045);
  });

  it("parses and normalizes SI.F price from Stooq commodities table HTML", () => {
    const quote = parseStooqQuoteHtml(`
      <html><body>
        <table><tr><td>SI.F</td><td>SILVER</td><td>7604.500</td><td>-0.10%</td></tr></table>
      </body></html>
    `, "SI.F", "SI");

    expect(quote.stooqSymbol).toBe("SI.F");
    expect(quote.quoteSymbol).toBe("SI");
    expect(quote.rawPrice).toBe(7604.5);
    expect(quote.price).toBe(76.045);
  });

  it("returns mixed payload when Sina futures and Twelve Data ETFs both succeed", async () => {
    process.env.MARKET_DATA_API_KEY = "test-etf-key";

    vi.stubGlobal("fetch", vi.fn(async (input: URL | RequestInfo) => {
      const url = input.toString();

      if (url.includes("hq.sinajs.cn")) {
        return textResponse(sinaResponse(4601.5, 72.25));
      }

      return jsonResponse({
        IAU: { symbol: "IAU", close: "86.55", percent_change: "0.1", datetime: "2026-05-21 09:30:00" },
        UGL: { symbol: "UGL", close: "58.10", percent_change: "0.2", datetime: "2026-05-21 09:30:00" },
        SLV: { symbol: "SLV", close: "65.80", percent_change: "-0.1", datetime: "2026-05-21 09:30:00" },
        AGQ: { symbol: "AGQ", close: "145.26", percent_change: "-0.2", datetime: "2026-05-21 09:30:00" }
      });
    }));

    const payload = await fetchMarketQuotes();
    const urls = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls
      .map(([input]) => input.toString())
      .filter((url: string) => url.includes("hq.sinajs.cn"));

    expect(payload.source).toBe("mixed");
    expect(payload.isMock).toBe(false);
    expect(payload.sources).toEqual({ comex: "sina", etf: "twelvedata" });
    expect(payload.warning).toBeUndefined();
    expect(payload.quotes.GC?.price).toBe(4601.5);
    expect(payload.quotes.SI?.price).toBe(72.25);
    expect(payload.items?.comexGold.price).toBe(4601.5);
    expect(payload.items?.AGQ.price).toBe(145.26);
    expect(urls).toHaveLength(1);
    expect(urls[0]).toContain("hf_GC");
    expect(urls[0]).toContain("hf_SI");
    expect(urls.some((url: string) => url.includes("XAU") || url.includes("XAG"))).toBe(false);
  });

  it("falls back to mock when Sina and Stooq futures sources fail", async () => {
    process.env.MARKET_DATA_API_KEY = "test-etf-key";

    vi.stubGlobal("fetch", vi.fn(async (input: URL | RequestInfo) => {
      const url = input.toString();
      if (url.includes("hq.sinajs.cn")) {
        return {
          ok: false,
          status: 500,
          text: async () => "",
          json: async () => ({})
        };
      }
      if (url.includes("stooq.com")) {
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
    expect(payload.warning).toContain("新浪财经行情请求失败");
    expect(payload.warning).toContain("HTTP 500");
  });

  it("throws Stooq parse diagnostic context when fallback HTML has no price", () => {
    expect(() => parseStooqQuoteHtml(
      "<html><body><h1>Gold (GC.F)</h1><div>no price here</div></body></html>",
      "GC.F",
      "GC"
    )).toThrow(/Stooq 页面解析失败.*GC\.F\/GC.*no price here/);
  });

  it("uses cached ETF quotes when the latest ETF response is partial", async () => {
    process.env.MARKET_DATA_API_KEY = "test-etf-key";

    vi.stubGlobal("fetch", vi.fn(async (input: URL | RequestInfo) => {
      const url = input.toString();

      if (url.includes("hq.sinajs.cn")) {
        return textResponse(sinaResponse(4601.5, 72.25));
      }

      return jsonResponse({
        IAU: { symbol: "IAU", close: "86.55" }
      });
    }));

    const payload = await fetchMarketQuotes();

    expect(payload.source).toBe("mixed");
    expect(payload.isMock).toBe(false);
    expect(payload.warning).toBeUndefined();
    expect(payload.items?.IAU.price).toBe(86.55);
    expect(payload.items?.AGQ.price).toBe(145.26);
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

function sinaResponse(gcPrice: number, siPrice: number): string {
  return [
    `var hq_str_hf_GC="${gcPrice},,,,,,14:15,,,,,,2026-05-23";`,
    `var hq_str_hf_SI="${siPrice},,,,,,14:15,,,,,,2026-05-23";`
  ].join("\n");
}
