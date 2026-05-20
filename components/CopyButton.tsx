"use client";

import { useState } from "react";

type CopyButtonProps = {
  value: string;
  label?: string;
  compact?: boolean;
  primary?: boolean;
  subtle?: boolean;
};

export function CopyButton({ value, label = "复制", compact = false, primary = false, subtle = false }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(value);
      } else {
        fallbackCopy(value);
      }
    } catch {
      fallbackCopy(value);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  const baseClasses = "inline-flex min-h-9 items-center justify-center rounded-md border px-3 text-sm transition";

  const variantClasses = primary
    ? "border-gold/60 bg-gold/15 text-white hover:border-gold hover:bg-gold/25 font-semibold"
    : subtle
      ? "border-line/50 bg-transparent text-silver/60 hover:border-line hover:text-silver"
      : "border-line bg-ink/70 text-silver hover:border-gold hover:text-white";

  const compactClasses = compact ? "min-w-9 px-2" : "";

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={[baseClasses, variantClasses, compactClasses].join(" ")}
      title={copied ? "已复制" : label}
      aria-label={copied ? "已复制" : label}
    >
      {copied ? "已复制" : label}
    </button>
  );
}

function fallbackCopy(value: string) {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}
