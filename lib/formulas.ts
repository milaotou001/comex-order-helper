import type { ConvertedOrder, Metal, PointKind, QuoteMap, RiskLevel } from "./types";

const METAL_CONFIG = {
  gold: {
    comex: "GC",
    plain: "IAU",
    leveraged: "UGL"
  },
  silver: {
    comex: "SI",
    plain: "SLV",
    leveraged: "AGQ"
  }
} as const;

export function calculateTakeProfit(entry: number, stop: number): number {
  return entry + 2 * (entry - stop);
}

export function isValidLongSetup(entry: number | null, stop: number | null): boolean {
  return entry !== null && stop !== null && Number.isFinite(entry) && Number.isFinite(stop) && stop < entry;
}

export function calculatePlainEtfPrice(
  currentEtfPrice: number,
  targetComexPoint: number,
  currentComexPrice: number
): number {
  assertPositive(currentEtfPrice, "currentEtfPrice");
  assertPositive(targetComexPoint, "targetComexPoint");
  assertPositive(currentComexPrice, "currentComexPrice");

  return currentEtfPrice * targetComexPoint / currentComexPrice;
}

export function calculateLeveragedEtfPrice(
  currentLeveragedPrice: number,
  targetComexPoint: number,
  currentComexPrice: number,
  leverage = 2
): number {
  assertPositive(currentLeveragedPrice, "currentLeveragedPrice");
  assertPositive(targetComexPoint, "targetComexPoint");
  assertPositive(currentComexPrice, "currentComexPrice");

  const changeRate = targetComexPoint / currentComexPrice - 1;
  return currentLeveragedPrice * (1 + leverage * changeRate);
}

export function calculateEasyPrice(standardPrice: number, easyPercent: number): number {
  assertPositive(standardPrice, "standardPrice");
  return standardPrice * (1 + easyPercent / 100);
}

export function calculateBargainPrice(standardPrice: number, bargainPercent: number): number {
  assertPositive(standardPrice, "standardPrice");
  return standardPrice * (1 - bargainPercent / 100);
}

export function calculateDistancePercent(targetComexPoint: number, currentComexPrice: number): number {
  assertPositive(targetComexPoint, "targetComexPoint");
  assertPositive(currentComexPrice, "currentComexPrice");
  return (targetComexPoint / currentComexPrice - 1) * 100;
}

export function getRiskLevel(distancePercent: number): RiskLevel {
  const absoluteDistance = Math.abs(distancePercent);
  if (absoluteDistance > 8) {
    return "danger";
  }
  if (absoluteDistance > 5) {
    return "warning";
  }
  return "normal";
}

export function buildConvertedOrder(
  metal: Metal,
  pointKind: PointKind,
  point: number,
  quotes: QuoteMap,
  easyPercent: number,
  bargainPercent: number
): ConvertedOrder | null {
  const config = METAL_CONFIG[metal];
  const comexQuote = quotes[config.comex];
  const plainQuote = quotes[config.plain];
  const leveragedQuote = quotes[config.leveraged];

  if (!comexQuote || !plainQuote || !leveragedQuote) {
    return null;
  }

  const standardPrice = calculatePlainEtfPrice(plainQuote.price, point, comexQuote.price);
  const leveragedPrice = calculateLeveragedEtfPrice(leveragedQuote.price, point, comexQuote.price);
  const distancePercent = calculateDistancePercent(point, comexQuote.price);

  return {
    metal,
    pointKind,
    point,
    plainSymbol: config.plain,
    leveragedSymbol: config.leveraged,
    standardPrice,
    easyPrice: calculateEasyPrice(standardPrice, easyPercent),
    bargainPrice: calculateBargainPrice(standardPrice, bargainPercent),
    leveragedPrice,
    distancePercent,
    riskLevel: getRiskLevel(distancePercent)
  };
}

function assertPositive(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be positive`);
  }
}
