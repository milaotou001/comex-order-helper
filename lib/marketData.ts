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

const SINA_COMEX_SYMBOLS: Record<string, string> = {
  GC: "hf_GC",
  SI: "hf_SI"
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

type StooqQuote = {
  stooqSymbol: string;
  quoteSymbol: QuoteSymbol;
  rawPrice: number;
  price: number;
  updatedAt: string;
  snippet: string;
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
        comex: "sina",
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
  try {
    return await fetchSinaComexQuotes();
  } catch (sinaError) {
    try {
      return await fetchStooqComexQuotes();
    } catch {
      throw sinaError;
    }
  }
}

async function fetchSinaComexQuotes(): Promise<QuoteMap> {
  const symbols = Object.values(SINA_COMEX_SYMBOLS).join(",");
  const endpoint = new URL("https://hq.sinajs.cn/list=" + symbols);

  const response = await fetchWithTimeout(endpoint, {
    headers: { Referer: "https://finance.sina.com.cn" }
  });

  if (!response.ok) {
    throw new Error(`新浪财经行情请求失败：HTTP ${response.status}`);
  }

  const text = await response.text();
  const quotes: QuoteMap = {};

  for (const [quoteSymbol, sinaSymbol] of Object.entries(SINA_COMEX_SYMBOLS) as Array<[QuoteSymbol, string]>) {
    const price = parseSinaQuoteLine(text, sinaSymbol);
    quotes[quoteSymbol] = {
      symbol: quoteSymbol,
      name: NAMES[quoteSymbol],
      price,
      updatedAt: new Date().toISOString()
    };
  }

  return quotes;
}

function parseSinaQuoteLine(text: string, sinaSymbol: string): number {
  const pattern = new RegExp(`hq_str_${escapeRegExp(sinaSymbol)}="([^"]*)"`);
  const match = text.match(pattern);
  if (!match) {
    throw new Error(`新浪财经未返回 ${sinaSymbol} 数据`);
  }

  const fields = match[1].split(",");
  const price = Number(fields[0]);
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(`新浪财经 ${sinaSymbol} 价格无效：${fields[0]}`);
  }

  return price;
}

async function fetchStooqComexQuotes(): Promise<QuoteMap> {
  const results = await Promise.all(
    COMEX_FUTURES.map(async (contract) => {
      const stooqQuote = await fetchStooqQuote(contract);
      return {
        symbol: contract.quoteSymbol,
        quote: {
          symbol: contract.quoteSymbol,
          name: NAMES[contract.quoteSymbol],
          price: stooqQuote.price,
          updatedAt: stooqQuote.updatedAt
        } as Quote
      };
    })
  );

  const quotes: QuoteMap = {};
  for (const { symbol, quote } of results) {
    quotes[symbol] = quote;
  }
  return quotes;
}

const FETCH_TIMEOUT_MS = 30000;

async function fetchWithTimeout(url: URL, options?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchStooqQuote(contract: (typeof COMEX_FUTURES)[number]): Promise<StooqQuote> {
  const endpoint = new URL("https://stooq.com/q/a2/");
  endpoint.searchParams.set("s", contract.stooqSymbol.toLowerCase());

  const response = await fetchWithTimeout(endpoint, {
    next: { revalidate: 0 }
  });

  if (!response.ok) {
    const body = await readResponseBody(response);
    const detail = body ? `，Stooq 返回：${body}` : "";
    throw new Error(`COMEX futures 延迟行情源请求失败：Stooq ${contract.stooqSymbol}/${contract.quoteSymbol} HTTP ${response.status}${detail}`);
  }

  const html = await response.text();
  return parseStooqQuoteHtml(html, contract.stooqSymbol, contract.quoteSymbol);
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

  const response = await fetchWithTimeout(endpoint, {
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

export function parseStooqQuoteHtml(html: string, stooqSymbol: "GC.F" | "SI.F", quoteSymbol: "GC" | "SI"): StooqQuote {
  const text = htmlToText(html);
  const symbolPattern = escapeRegExp(stooqSymbol);
  const titlePattern = new RegExp(`(?:Gold|Silver)\\s*\\(${symbolPattern}\\)`, "i");
  const titleMatch = text.match(titlePattern);

  if (titleMatch?.index !== undefined) {
    const snippet = text.slice(titleMatch.index, titleMatch.index + 240);
    const rawPrice = findReasonableStooqPrice(getLikelyPriceSegment(snippet), quoteSymbol);
    if (rawPrice !== null) {
      return buildStooqQuote(stooqSymbol, quoteSymbol, rawPrice, new Date().toISOString(), snippet);
    }
  }

  const mainPattern = new RegExp(`${symbolPattern}\\s+(?:GOLD|SILVER)\\s*([0-9]+(?:[.,][0-9]+)?)`, "i");
  const mainMatch = text.match(mainPattern);

  if (mainMatch) {
    const rawPrice = findReasonableStooqPrice(mainMatch[0], quoteSymbol) ?? parseStooqNumber(mainMatch[1]);
    return buildStooqQuote(stooqSymbol, quoteSymbol, rawPrice, new Date().toISOString(), mainMatch[0]);
  }

  throw new Error(`Stooq 页面解析失败：${stooqSymbol}/${quoteSymbol}，原始片段：${createDiagnosticSnippet(text, stooqSymbol)}`);
}

function buildStooqQuote(
  stooqSymbol: "GC.F" | "SI.F",
  quoteSymbol: "GC" | "SI",
  rawPrice: number,
  updatedAt: string,
  snippet: string
): StooqQuote {
  if (!Number.isFinite(rawPrice) || rawPrice <= 0) {
    throw new Error(`Stooq 页面解析到无效价格：${stooqSymbol}/${quoteSymbol}，原始片段：${sanitizeDiagnosticText(snippet)}`);
  }

  return {
    stooqSymbol,
    quoteSymbol,
    rawPrice,
    price: quoteSymbol === "SI" && rawPrice > 1000 ? rawPrice / 100 : rawPrice,
    updatedAt,
    snippet: sanitizeDiagnosticText(snippet)
  };
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function parseStooqNumber(value: string): number {
  return Number(value.replace(",", "."));
}

function findReasonableStooqPrice(snippet: string, quoteSymbol: "GC" | "SI"): number | null {
  const matches = snippet.matchAll(/(?<![\d.])-?\d+(?:[.,]\d+)(?![\d.])/g);

  for (const match of matches) {
    const raw = parseStooqNumber(match[0]);
    const normalized = quoteSymbol === "SI" && raw > 1000 ? raw / 100 : raw;

    if (isReasonableComexPrice(normalized, quoteSymbol)) {
      return raw;
    }
  }

  return null;
}

function getLikelyPriceSegment(snippet: string): string {
  const timeMatch = snippet.match(/\b\d{1,2}:\d{2}\b/);
  if (timeMatch?.index !== undefined) {
    return snippet.slice(timeMatch.index + timeMatch[0].length);
  }
  return snippet;
}

function isReasonableComexPrice(price: number, quoteSymbol: "GC" | "SI"): boolean {
  if (!Number.isFinite(price)) {
    return false;
  }

  if (quoteSymbol === "GC") {
    return price >= 1000 && price <= 10000;
  }

  return price >= 5 && price <= 200;
}

function createDiagnosticSnippet(text: string, stooqSymbol: string): string {
  const index = text.toUpperCase().indexOf(stooqSymbol.toUpperCase());
  if (index >= 0) {
    return sanitizeDiagnosticText(text.slice(Math.max(0, index - 80), index + 220));
  }
  return sanitizeDiagnosticText(text.slice(0, 240));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
