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
  source: "twelvedata";
  error?: string;
};

export type PointKind = "entry" | "stop" | "target";

export type OrderSettings = {
  easyPercent: number;
  bargainPercent: number;
  refreshIntervalMinutes: number;
  showLeveraged: boolean;
  decimals: number;
};

export type RiskLevel = "normal" | "warning" | "danger";

export type ConvertedOrder = {
  metal: Metal;
  pointKind: PointKind;
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
