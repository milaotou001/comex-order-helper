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

export type QuotePayload = {
  quotes: QuoteMap;
  updatedAt: string | null;
  source: "twelvedata" | "mock";
  error?: string;
};

export type CopyPriceType = "standard" | "easy" | "bargain";

export type OrderSettings = {
  easyPercent: number;
  bargainPercent: number;
  refreshIntervalMinutes: number;
  showLeveraged: boolean;
  decimals: number;
  copyPriceType: CopyPriceType;
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
