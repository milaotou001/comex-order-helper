"use client";

import { ResultCard } from "./ResultCard";
import type { ConvertedOrder, OrderSettings } from "@/lib/types";

type GoldResultCardProps = {
  order: ConvertedOrder;
  settings: OrderSettings;
};

export function GoldResultCard({ order, settings }: GoldResultCardProps) {
  return <ResultCard order={order} settings={settings} accent="gold" />;
}
