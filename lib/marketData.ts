import type { Quote, QuoteItems, QuoteMap, QuotePayload, QuoteSymbol } from "./types";

const ETF_SYMBOLS = ["IAU", "UGL", "SLV", "AGQ"] as const;

const DEFAULT_ETF_SYMBOLS: Record<(typeof ETF_SYMBOLS)[number], string> = {
  IAU: "IAU",
  UGL: "UGL",
  SLV: "SLV",
  AGQ: "AGQ"
};

const COMEX_FUTURES = [
  {
    quoteSymbol: "GC",
    stooqSymbol: "GC.F"
  },
  {
    quoteSymbol: "SI",
    stooqSymbol: "SI.F"
  }
] as const;

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

type StooqQuote = {
  stooqSymbol: string;
  quoteSymbol: QuoteSymbol;
  price: number;
  updatedAt: string;
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
  try {
    const [comexQuotes, etfQuotes] = await Promise.all([
      fetchComexFuturesQuotes(),
      fetchEtfQuotes()
    ]);

    const quotes: QuoteMap = {
      ...comexQuotes,
      ...etfQuotes
    };

    const missingQuotes = getMissingQuotes(quotes);
    if (missingQuotes.length > 0) {
      return mockPayload(`真实行情缺少有效价格：${missingQuotes.join(", ")}，回退 mock 行情`);
    }

    return {
      quotes,
      items: buildItems(quotes),
      updatedAt: new Date().toISOString(),
      source: "mixed",
      sources: {
        comex: "stooq",
        etf: "twelvedata"
      },
      isMock: false
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "真实行情请求异常";
    return mockPayload(`${message}，回退 mock 行情`);
  }
}

async function fetchComexFuturesQuotes(): Promise<QuoteMap> {
  const endpoint = new URL("https://stooq.pl/q/l/");
  endpoint.searchParams.set("s", COMEX_FUTURES.map((item) => item.stooqSymbol).join(" "));
  endpoint.searchParams.set("e", "xml");

  const response = await fetch(endpoint, {
    next: { revalidate: 0 }
  });

  if (!response.ok) {
    const body = await readResponseBody(response);
    const detail = body ? `，Stooq 返回：${body}` : "";
    throw new Error(`COMEX futures 延迟行情源请求失败：Stooq HTTP ${response.status}${detail}`);
  }

  const xml = await response.text();
  const stooqQuotes = parseStooqQuoteXml(xml);
  const quotes: QuoteMap = {};

  for (const contract of COMEX_FUTURES) {
    const row = stooqQuotes.find((item) => item.stooqSymbol.toUpperCase() === contract.stooqSymbol.toUpperCase());
    if (!row) {
      throw new Error(`COMEX futures 延迟行情价格无效：${contract.stooqSymbol}/${contract.quoteSymbol}`);
    }

    const quote: Quote = {
      symbol: contract.quoteSymbol,
      name: NAMES[contract.quoteSymbol],
      price: row.price,
      updatedAt: row.updatedAt
    };

    quotes[contract.quoteSymbol] = quote;
  }

  return quotes;
}

async function readResponseBody(response: Response): Promise<string> {
  try {
    const body = await response.text();
    return sanitizeDiagnosticText(body);
  } catch {
    return "";
  }
}

function sanitizeDiagnosticText(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240);
}

async function fetchEtfQuotes(): Promise<QuoteMap> {
  const provider = process.env.MARKET_DATA_PROVIDER ?? "twelvedata";
  const apiKey = process.env.MARKET_DATA_API_KEY;

  if (provider !== "twelvedata") {
    throw new Error("ETF 行情源未配置为 twelvedata");
  }

  if (!apiKey) {
    throw new Error("未配置 MARKET_DATA_API_KEY，ETF 行情源不可用");
  }

  const symbols = getEtfSymbols();
  const endpoint = new URL("https://api.twelvedata.com/quote");
  endpoint.searchParams.set("symbol", Object.values(symbols).join(","));
  endpoint.searchParams.set("apikey", apiKey);

  const response = await fetch(endpoint, {
    next: { revalidate: 0 }
  });

  if (!response.ok) {
    throw new Error(`ETF 行情源请求失败：HTTP ${response.status}`);
  }

  const raw = await response.json();
  return normalizeEtfQuotes(raw, symbols, new Date().toISOString());
}

function mockPayload(reason: string): QuotePayload {
  return {
    quotes: MOCK_QUOTES,
    items: buildItems(MOCK_QUOTES),
    updatedAt: new Date().toISOString(),
    source: "mock",
    isMock: true,
    warning: reason,
    error: reason
  };
}

function getEtfSymbols(): Record<(typeof ETF_SYMBOLS)[number], string> {
  return {
    IAU: process.env.IAU_SYMBOL ?? DEFAULT_ETF_SYMBOLS.IAU,
    UGL: process.env.UGL_SYMBOL ?? DEFAULT_ETF_SYMBOLS.UGL,
    SLV: process.env.SLV_SYMBOL ?? DEFAULT_ETF_SYMBOLS.SLV,
    AGQ: process.env.AGQ_SYMBOL ?? DEFAULT_ETF_SYMBOLS.AGQ
  };
}

function normalizeEtfQuotes(
  raw: unknown,
  symbols: Record<(typeof ETF_SYMBOLS)[number], string>,
  now: string
): QuoteMap {
  const rows = extractRows(raw);
  const quotes: QuoteMap = {};

  for (const [localSymbol, apiSymbol] of Object.entries(symbols) as Array<[(typeof ETF_SYMBOLS)[number], string]>) {
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

function getMissingQuotes(quotes: QuoteMap): QuoteSymbol[] {
  return (Object.keys(NAMES) as QuoteSymbol[]).filter((symbol) => !quotes[symbol]);
}

function buildItems(quotes: QuoteMap): QuoteItems {
  return {
    comexGold: requireQuote(quotes, "GC"),
    comexSilver: requireQuote(quotes, "SI"),
    IAU: requireQuote(quotes, "IAU"),
    UGL: requireQuote(quotes, "UGL"),
    SLV: requireQuote(quotes, "SLV"),
    AGQ: requireQuote(quotes, "AGQ")
  };
}

function requireQuote(quotes: QuoteMap, symbol: QuoteSymbol): Quote {
  const quote = quotes[symbol];
  if (!quote) {
    throw new Error(`缺少行情：${symbol}`);
  }
  return quote;
}

export function parseStooqQuoteXml(xml: string): StooqQuote[] {
  const quotes: StooqQuote[] = [];
  const blocks = xml.matchAll(/<(?:symbol|quote)>\s*([\s\S]*?)\s*<\/(?:symbol|quote)>/gi);

  for (const block of blocks) {
    const body = block[1];
    const stooqSymbol = readXmlTag(body, "id") ?? readXmlTag(body, "symbol");
    const close = readXmlTag(body, "close");
    const date = readXmlTag(body, "date");
    const time = readXmlTag(body, "time");
    const price = close === null ? Number.NaN : Number(close);

    if (!stooqSymbol || !Number.isFinite(price) || price <= 0) {
      continue;
    }

    const contract = COMEX_FUTURES.find((item) => item.stooqSymbol.toUpperCase() === stooqSymbol.toUpperCase());
    if (!contract) {
      continue;
    }

    quotes.push({
      stooqSymbol,
      quoteSymbol: contract.quoteSymbol,
      price,
      updatedAt: formatStooqUpdatedAt(date, time)
    });
  }

  return quotes;
}

function readXmlTag(body: string, tag: string): string | null {
  const match = body.match(new RegExp(`<${tag}>\\s*([^<]+?)\\s*<\\/${tag}>`, "i"));
  return match?.[1]?.trim() ?? null;
}

function formatStooqUpdatedAt(date: string | null, time: string | null): string {
  if (!date || !/^\d{8}$/.test(date)) {
    return new Date().toISOString();
  }

  const normalizedTime = time && /^\d{6}$/.test(time) ? time : "000000";
  const year = date.slice(0, 4);
  const month = date.slice(4, 6);
  const day = date.slice(6, 8);
  const hour = normalizedTime.slice(0, 2);
  const minute = normalizedTime.slice(2, 4);
  const second = normalizedTime.slice(4, 6);

  return `${year}-${month}-${day}T${hour}:${minute}:${second}+01:00`;
}
