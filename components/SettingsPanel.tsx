"use client";

import type { CopyPriceType, OrderSettings } from "@/lib/types";
import { getCopyTypeLabel } from "@/lib/format";

type SettingsPanelProps = {
  settings: OrderSettings;
  onChange: (settings: OrderSettings) => void;
};

const COPY_OPTIONS: { value: CopyPriceType; short: string }[] = [
  { value: "standard", short: "标准价" },
  { value: "easy", short: "容易成交价" },
  { value: "bargain", short: "捡漏价" }
];

export function SettingsPanel({ settings, onChange }: SettingsPanelProps) {
  return (
    <section className="border-t border-line py-6">
      <h2 className="mb-4 text-lg font-semibold text-white">设置</h2>

      <div className="mb-5 rounded-md border border-gold/60 bg-gold/8 p-4">
        <p className="mb-3 text-sm font-semibold text-gold">当前复制价格类型</p>
        <div className="flex flex-wrap gap-2">
          {COPY_OPTIONS.map((option) => {
            const active = settings.copyPriceType === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange({ ...settings, copyPriceType: option.value })}
                className={`rounded-md border px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? "border-gold bg-gold text-ink"
                    : "border-line bg-panel text-silver hover:border-gold/50 hover:text-white"
                }`}
              >
                {active ? `✓ ${option.short}` : option.short}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs leading-5 text-silver/80">
          点击"复制 IAU / SLV 挂单价"时将复制：<span className="font-semibold text-white">{getCopyTypeLabel(settings.copyPriceType)}</span>。
          杠杆 ETF 参考价不区分三档，始终复制单一定价。
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <NumberSetting
          label="容易成交上浮%"
          value={settings.easyPercent}
          min={0}
          step={0.05}
          onChange={(easyPercent) => onChange({ ...settings, easyPercent })}
        />
        <NumberSetting
          label="捡漏下浮%"
          value={settings.bargainPercent}
          min={0}
          step={0.05}
          onChange={(bargainPercent) => onChange({ ...settings, bargainPercent })}
        />
        <NumberSetting
          label="刷新间隔(分钟)"
          value={settings.refreshIntervalMinutes}
          min={0}
          step={1}
          onChange={(refreshIntervalMinutes) => onChange({ ...settings, refreshIntervalMinutes })}
        />
        <NumberSetting
          label="小数位"
          value={settings.decimals}
          min={0}
          max={4}
          step={1}
          onChange={(decimals) => onChange({ ...settings, decimals: Math.round(decimals) })}
        />
      </div>

      <label className="mt-4 flex items-center justify-between rounded-md border border-line bg-panel px-3 py-3 text-sm text-silver">
        <span>显示 UGL / AGQ</span>
        <input
          type="checkbox"
          checked={settings.showLeveraged}
          onChange={(event) => onChange({ ...settings, showLeveraged: event.target.checked })}
          className="h-5 w-5 accent-gold"
        />
      </label>
    </section>
  );
}

type NumberSettingProps = {
  label: string;
  value: number;
  min: number;
  max?: number;
  step: number;
  onChange: (value: number) => void;
};

function NumberSetting({ label, value, min, max, step, onChange }: NumberSettingProps) {
  return (
    <label className="block rounded-md border border-line bg-panel px-3 py-3">
      <span className="mb-2 block text-sm text-silver">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-11 w-full rounded-md border border-line bg-ink px-3 font-mono text-white"
      />
    </label>
  );
}
