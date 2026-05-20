"use client";

import { ResultCard } from "./ResultCard";
import type { ConvertedOrder, OrderSettings } from "@/lib/types";

type SilverResultCardProps = {
  order: ConvertedOrder;
  settings: OrderSettings;
};

export function SilverResultCard({ order, settings }: SilverResultCardProps) {
  return <ResultCard order={order} settings={settings} accent="silver" />;
}
