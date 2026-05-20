"use client";

import type { OrderSettings } from "@/lib/types";

type SettingsPanelProps = {
  settings: OrderSettings;
  onChange: (settings: OrderSettings) => void;
};

export function SettingsPanel({ settings, onChange }: SettingsPanelProps) {
  return (
    <section className="border-t border-line py-6">
      <h2 className="mb-4 text-lg font-semibold text-white">设置</h2>
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
