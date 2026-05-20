"use client";

import { useState } from "react";

type CopyButtonProps = {
  value: string;
  label?: string;
  compact?: boolean;
};

export function CopyButton({ value, label = "复制", compact = false }: CopyButtonProps) {
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

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={[
        "inline-flex min-h-9 items-center justify-center rounded-md border border-line bg-ink/70 px-3 text-sm text-silver transition hover:border-gold hover:text-white",
        compact ? "min-w-9 px-2" : ""
      ].join(" ")}
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
