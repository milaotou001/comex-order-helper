import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const COMMODITIES = ["gold", "silver", "micro_silver"];
const API_BASE = "https://api.api-ninjas.com/v1/commodityprice";

loadDotEnvLocal();

const apiKey = process.env.COMMODITY_DATA_API_KEY;
if (!apiKey) {
  console.error("Missing COMMODITY_DATA_API_KEY. Set it in .env.local or the current shell.");
  process.exit(1);
}

for (const name of COMMODITIES) {
  const endpoint = new URL(API_BASE);
  endpoint.searchParams.set("name", name);

  try {
    const response = await fetch(endpoint, {
      headers: {
        "X-Api-Key": apiKey
      }
    });
    const body = await response.text();
    const price = extractPrice(body);

    console.log(`\ncommodity: ${name}`);
    console.log(`status: ${response.status}`);
    console.log(`body: ${body}`);
    console.log(`hasPrice: ${price !== null}`);
    if (price !== null) {
      console.log(`price: ${price}`);
    }
  } catch (error) {
    console.log(`\ncommodity: ${name}`);
    console.log("status: request failed");
    console.log(`body: ${error instanceof Error ? error.message : String(error)}`);
    console.log("hasPrice: false");
  }
}

function extractPrice(body) {
  try {
    const parsed = JSON.parse(body);
    const price = Number(parsed?.price);
    return Number.isFinite(price) && price > 0 ? price : null;
  } catch {
    return null;
  }
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
