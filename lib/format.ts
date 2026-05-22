import type { ConvertedOrder } from "./types";

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
    `${order.plainSymbol}挂单 ${formatPrice(order.easyPrice, decimals)}`,
    `按标准价上浮`,
    `${order.leveragedSymbol}参考 ${formatPrice(order.leveragedPrice, decimals)}`,
    `距当前 ${formatPercent(order.distancePercent)}`
  ].join("｜");
}

export function getMainOrderPrice(order: ConvertedOrder): number {
  return order.easyPrice;
}
