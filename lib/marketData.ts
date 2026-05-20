import type { Quote, QuoteMap, QuotePayload, QuoteSymbol } from "./types";

const DEFAULT_SYMBOLS: Record<QuoteSymbol, QuoteSymbol> = {
  GC: "GC",
  SI: "SI",
  IAU: "IAU",
  UGL: "UGL",
  SLV: "SLV",
  AGQ: "AGQ"
};

const NAMES: Record<QuoteSymbol, string> = {
  GC: "COMEX黄金",
  SI: "COMEX白银",
  IAU: "IAU",
  UGL: "UGL",
  SLV: "SLV",
  AGQ: "AGQ"
};

type TwelveDataQuote = {
  symbol: string;
  close?: string;
  price?: string;
  percent_change?: string;
  datetime?: string;
};

const MOCK_QUOTES: QuoteMap = {
  GC: { symbol: "GC", name: "COMEX黄金", price: 4600, updatedAt: "mock" },
  SI: { symbol: "SI", name: "COMEX白银", price: 72, updatedAt: "mock" },
  IAU: { symbol: "IAU", name: "IAU", price: 86.55, updatedAt: "mock" },
  UGL: { symbol: "UGL", name: "UGL", price: 58.10, updatedAt: "mock" },
  SLV: { symbol: "SLV", name: "SLV", price: 65.80, updatedAt: "mock" },
  AGQ: { symbol: "AGQ", name: "AGQ", price: 145.26, updatedAt: "mock" }
};

export async function fetchMarketQuotes(): Promise<QuotePayload> {
  const apiKey = process.env.MARKET_DATA_API_KEY;
  const provider = process.env.MARKET_DATA_PROVIDER ?? "twelvedata";

  if (provider !== "twelvedata") {
    return mockPayload("当前仅支持 Twelve Data 行情源，使用 mock 行情");
  }

  if (!apiKey) {
    return mockPayload("未配置 MARKET_DATA_API_KEY，使用 mock 行情");
  }

  const symbols = getSymbols();
  const apiSymbols = Object.values(symbols).join(",");
  const endpoint = new URL("https://api.twelvedata.com/quote");
  endpoint.searchParams.set("symbol", apiSymbols);
  endpoint.searchParams.set("apikey", apiKey);

  try {
    const response = await fetch(endpoint, {
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      return mockPayload(`行情请求失败：${response.status}，回退 mock 行情`);
    }

    const raw = await response.json();
    const now = new Date().toISOString();
    const quotes = normalizeQuotes(raw, symbols, now);

    if (Object.keys(quotes).length === 0) {
      return mockPayload("行情数据为空，回退 mock 行情");
    }

    return {
      quotes,
      updatedAt: now,
      source: "twelvedata"
    };
  } catch {
    return mockPayload("行情请求异常，回退 mock 行情");
  }
}

function mockPayload(reason: string): QuotePayload {
  return {
    quotes: MOCK_QUOTES,
    updatedAt: new Date().toISOString(),
    source: "mock",
    error: reason
  };
}

function getSymbols(): Record<QuoteSymbol, string> {
  return {
    GC: process.env.COMEX_GOLD_SYMBOL ?? DEFAULT_SYMBOLS.GC,
    SI: process.env.COMEX_SILVER_SYMBOL ?? DEFAULT_SYMBOLS.SI,
    IAU: process.env.IAU_SYMBOL ?? DEFAULT_SYMBOLS.IAU,
    UGL: process.env.UGL_SYMBOL ?? DEFAULT_SYMBOLS.UGL,
    SLV: process.env.SLV_SYMBOL ?? DEFAULT_SYMBOLS.SLV,
    AGQ: process.env.AGQ_SYMBOL ?? DEFAULT_SYMBOLS.AGQ
  };
}

function normalizeQuotes(
  raw: unknown,
  symbols: Record<QuoteSymbol, string>,
  now: string
): QuoteMap {
  const rows = Array.isArray(raw) ? raw : Object.values(raw as Record<string, TwelveDataQuote>);
  const quotes: QuoteMap = {};

  for (const [localSymbol, apiSymbol] of Object.entries(symbols) as Array<[QuoteSymbol, string]>) {
    const row = rows.find((item) => item?.symbol === apiSymbol);
    if (!row) {
      continue;
    }

    const price = Number(row.close ?? row.price);
    if (!Number.isFinite(price) || price <= 0) {
      continue;
    }

    const quote: Quote = {
      symbol: localSymbol,
      name: NAMES[localSymbol],
      price,
      updatedAt: row.datetime ?? now
    };

    const changePercent = Number(row.percent_change);
    if (Number.isFinite(changePercent)) {
      quote.changePercent = changePercent;
    }

    quotes[localSymbol] = quote;
  }

  return quotes;
}
