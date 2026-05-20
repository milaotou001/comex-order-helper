import type { ConvertedOrder, CopyPriceType } from "./types";

export function formatPrice(value: number, decimals = 2): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

export function formatPoint(value: number): string {
  return Number.isInteger(value) ? value.toFixed(0) : value.toString();
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function buildCopyLine(order: ConvertedOrder, decimals = 2): string {
  const metalLabel = order.metal === "gold" ? "COMEX黄金" : "COMEX白银";

  return [
    `${metalLabel} ${formatPoint(order.point)}`,
    `${order.plainSymbol}标准 ${formatPrice(order.standardPrice, decimals)}`,
    `${order.plainSymbol}容易成交 ${formatPrice(order.easyPrice, decimals)}`,
    `${order.plainSymbol}捡漏 ${formatPrice(order.bargainPrice, decimals)}`,
    `${order.leveragedSymbol}参考 ${formatPrice(order.leveragedPrice, decimals)}`,
    `距当前 ${formatPercent(order.distancePercent)}`
  ].join("｜");
}

export function getSelectedPlainPrice(order: ConvertedOrder, type: CopyPriceType): number {
  switch (type) {
    case "easy":
      return order.easyPrice;
    case "bargain":
      return order.bargainPrice;
    default:
      return order.standardPrice;
  }
}

const COPY_TYPE_LABELS: Record<CopyPriceType, string> = {
  standard: "标准价",
  easy: "容易成交价",
  bargain: "捡漏价"
};

export function getCopyTypeLabel(type: CopyPriceType): string {
  return COPY_TYPE_LABELS[type];
}
