export type Metal = "gold" | "silver";

export type QuoteSymbol = "GC" | "SI" | "IAU" | "UGL" | "SLV" | "AGQ";

export type Quote = {
  symbol: QuoteSymbol;
  name: string;
  price: number;
  changePercent?: number;
  updatedAt: string;
};

export type QuoteMap = Partial<Record<QuoteSymbol, Quote>>;

export type QuoteItems = {
  comexGold: Quote;
  comexSilver: Quote;
  IAU: Quote;
  UGL: Quote;
  SLV: Quote;
  AGQ: Quote;
};

export type QuotePayload = {
  quotes: QuoteMap;
  items?: QuoteItems;
  updatedAt: string | null;
  source: "mixed" | "mock";
  sources?: {
    comex: "sina";
    etf: "twelvedata";
  };
  isMock: boolean;
  warning?: string;
  error?: string;
};

export type OrderSettings = {
  easyPercent: number;
  bargainPercent: number;
  refreshIntervalMinutes: number;
  decimals: number;
};

export type RiskLevel = "normal" | "warning" | "danger";

export type ConvertedOrder = {
  metal: Metal;
  point: number;
  plainSymbol: "IAU" | "SLV";
  leveragedSymbol: "UGL" | "AGQ";
  standardPrice: number;
  easyPrice: number;
  bargainPrice: number;
  leveragedPrice: number;
  distancePercent: number;
  riskLevel: RiskLevel;
};
