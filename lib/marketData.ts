import type { Quote, QuoteMap, QuotePayload, QuoteSymbol } from "./types";

const DEFAULT_ETF_SYMBOLS = {
  IAU: "IAU",
  UGL: "UGL",
  SLV: "SLV",
  AGQ: "AGQ"
} as const;

const NAMES: Record<QuoteSymbol, string> = {
  GC: "COMEX黄金",
  SI: "COMEX白银",
  IAU: "IAU",
  UGL: "UGL",
  SLV: "SLV",
  AGQ: "AGQ"
};

const SYMBOL_ENV_NAMES: Record<QuoteSymbol, string> = {
  GC: "COMEX_GOLD_SYMBOL",
  SI: "COMEX_SILVER_SYMBOL",
  IAU: "IAU_SYMBOL",
  UGL: "UGL_SYMBOL",
  SLV: "SLV_SYMBOL",
  AGQ: "AGQ_SYMBOL"
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
  const missingSymbols = getMissingSymbolEnvNames(symbols);
  if (missingSymbols.length > 0) {
    return mockPayload(`未配置 Twelve Data symbol：${missingSymbols.join(", ")}，使用 mock 行情`);
  }

  const apiSymbols = Object.values(symbols)
    .filter((symbol): symbol is string => Boolean(symbol))
    .join(",");
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

    const missingQuotes = getMissingQuotes(quotes);
    if (missingQuotes.length > 0) {
      return mockPayload(`真实行情缺少有效价格：${missingQuotes.join(", ")}，回退 mock 行情`);
    }

    return {
      quotes,
      updatedAt: now,
      source: "twelvedata",
      isMock: false
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
    isMock: true,
    warning: reason,
    error: reason
  };
}

function getSymbols(): Record<QuoteSymbol, string | undefined> {
  return {
    GC: process.env.COMEX_GOLD_SYMBOL,
    SI: process.env.COMEX_SILVER_SYMBOL,
    IAU: process.env.IAU_SYMBOL ?? DEFAULT_ETF_SYMBOLS.IAU,
    UGL: process.env.UGL_SYMBOL ?? DEFAULT_ETF_SYMBOLS.UGL,
    SLV: process.env.SLV_SYMBOL ?? DEFAULT_ETF_SYMBOLS.SLV,
    AGQ: process.env.AGQ_SYMBOL ?? DEFAULT_ETF_SYMBOLS.AGQ
  };
}

function normalizeQuotes(
  raw: unknown,
  symbols: Record<QuoteSymbol, string | undefined>,
  now: string
): QuoteMap {
  const rows = extractRows(raw);
  const quotes: QuoteMap = {};

  for (const [localSymbol, apiSymbol] of Object.entries(symbols) as Array<[QuoteSymbol, string | undefined]>) {
    if (!apiSymbol) {
      continue;
    }

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

function extractRows(raw: unknown): TwelveDataQuote[] {
  if (Array.isArray(raw)) {
    return raw.filter(isQuoteRow);
  }

  if (!raw || typeof raw !== "object") {
    return [];
  }

  return Object.values(raw as Record<string, unknown>).filter(isQuoteRow);
}

function isQuoteRow(value: unknown): value is TwelveDataQuote {
  return Boolean(value && typeof value === "object" && "symbol" in value);
}

function getMissingSymbolEnvNames(symbols: Record<QuoteSymbol, string | undefined>): string[] {
  return (Object.entries(symbols) as Array<[QuoteSymbol, string | undefined]>)
    .filter(([, symbol]) => !symbol)
    .map(([localSymbol]) => SYMBOL_ENV_NAMES[localSymbol]);
}

function getMissingQuotes(quotes: QuoteMap): QuoteSymbol[] {
  return (Object.keys(NAMES) as QuoteSymbol[]).filter((symbol) => !quotes[symbol]);
}
