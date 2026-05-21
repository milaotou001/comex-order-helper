import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const API_BASE = "https://api.twelvedata.com";
const DEFAULT_TERMS = ["iau", "ugl", "slv", "agq"];

loadDotEnvLocal();

const apiKey = process.env.MARKET_DATA_API_KEY;
if (!apiKey) {
  console.error("Missing MARKET_DATA_API_KEY. Set it in .env.local or the current shell.");
  process.exit(1);
}

const terms = process.argv.slice(2).length > 0 ? process.argv.slice(2) : DEFAULT_TERMS;

await showMatches("ETF reference data", "/etf", terms);

async function showMatches(title, pathname, keywords) {
  const url = new URL(pathname, API_BASE);
  url.searchParams.set("apikey", apiKey);

  const response = await fetch(url);
  if (!response.ok) {
    console.error(`${title}: request failed with HTTP ${response.status}`);
    return;
  }

  const payload = await response.json();
  const rows = Array.isArray(payload?.data) ? payload.data : [];
  const matches = rows.filter((row) => matchesAnyKeyword(row, keywords));

  console.log(`\n${title}`);
  console.log("-".repeat(title.length));

  if (matches.length === 0) {
    console.log("No matches. Try passing extra keywords, for example: npm run symbols:twelvedata -- futures gold");
    return;
  }

  for (const row of matches.slice(0, 40)) {
    const fields = [
      row.symbol,
      row.name,
      row.exchange,
      row.currency,
      row.type
    ].filter(Boolean);
    console.log(fields.join(" | "));
  }
}

function matchesAnyKeyword(row, keywords) {
  const haystack = Object.values(row)
    .filter((value) => typeof value === "string")
    .join(" ")
    .toLowerCase();

  return keywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
}

function loadDotEnvLocal() {
  const filePath = resolve(process.cwd(), ".env.local");
  if (!existsSync(filePath)) {
    return;
  }

  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const [key, ...valueParts] = trimmed.split("=");
    if (!process.env[key]) {
      process.env[key] = valueParts.join("=").replace(/^["']|["']$/g, "");
    }
  }
}
