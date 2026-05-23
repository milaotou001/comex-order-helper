import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fetchMarketQuotes } from "./marketData";
import type { QuotePayload } from "./types";

const REAL_TTL_MS = 2 * 60 * 1000;
const MOCK_TTL_MS = 60 * 1000;
const STALE_GRACE_MS = 60 * 60 * 1000;
const CACHE_FILE = path.join(os.tmpdir(), "comex-order-helper", "quotes-cache.json");

type CacheEntry = {
  payload: QuotePayload;
  storedAt: number;
  expiresAt: number;
};

type PrimedCache = Omit<CacheEntry, "storedAt"> & { storedAt?: number };

let memoryCache: CacheEntry | null = null;
let inFlight: Promise<QuotePayload> | null = null;

export async function getSharedQuotePayload(): Promise<QuotePayload> {
  const now = Date.now();
  const cached = await getCachedEntry();

  if (cached && cached.expiresAt > now) {
    return cached.payload;
  }

  if (inFlight) {
    return inFlight;
  }

  inFlight = refreshCache(cached);

  try {
    return await inFlight;
  } finally {
    inFlight = null;
  }
}

export function resetSharedQuoteCacheForTests() {
  memoryCache = null;
  inFlight = null;
}

export function primeSharedQuoteCacheForTests(payload: QuotePayload, options?: PrimedCache) {
  const storedAt = options?.storedAt ?? Date.now();
  memoryCache = {
    payload,
    storedAt,
    expiresAt: options?.expiresAt ?? storedAt + (payload.isMock ? MOCK_TTL_MS : REAL_TTL_MS)
  };
}

async function getCachedEntry(): Promise<CacheEntry | null> {
  if (memoryCache) {
    return memoryCache;
  }

  const diskCache = await readDiskCache();
  if (diskCache) {
    memoryCache = diskCache;
  }

  return diskCache;
}

async function refreshCache(staleCache: CacheEntry | null): Promise<QuotePayload> {
  const livePayload = await fetchMarketQuotes();
  const now = Date.now();

  if (livePayload.isMock && staleCache?.payload && !staleCache.payload.isMock && now - staleCache.storedAt < STALE_GRACE_MS) {
    const payload = withWarning(
      staleCache.payload,
      livePayload.warning ?? livePayload.error ?? "行情刷新失败，继续使用上次成功行情"
    );
    memoryCache = {
      payload,
      storedAt: staleCache.storedAt,
      expiresAt: now + MOCK_TTL_MS
    };
    await writeDiskCache(memoryCache);
    return payload;
  }

  const ttlMs = livePayload.isMock ? MOCK_TTL_MS : REAL_TTL_MS;
  memoryCache = {
    payload: livePayload,
    storedAt: now,
    expiresAt: now + ttlMs
  };
  await writeDiskCache(memoryCache);
  return livePayload;
}

async function readDiskCache(): Promise<CacheEntry | null> {
  try {
    const text = await readFile(CACHE_FILE, "utf8");
    const parsed = JSON.parse(text) as Partial<CacheEntry>;

    if (!parsed || typeof parsed !== "object" || !parsed.payload || typeof parsed.expiresAt !== "number") {
      return null;
    }

    const storedAt = typeof parsed.storedAt === "number" ? parsed.storedAt : parsed.expiresAt - REAL_TTL_MS;
    return {
      payload: parsed.payload as QuotePayload,
      storedAt,
      expiresAt: parsed.expiresAt
    };
  } catch {
    return null;
  }
}

async function writeDiskCache(entry: CacheEntry): Promise<void> {
  try {
    await mkdir(path.dirname(CACHE_FILE), { recursive: true });
    await writeFile(CACHE_FILE, JSON.stringify(entry), "utf8");
  } catch {
    // Best-effort cache only.
  }
}

function withWarning(payload: QuotePayload, warning: string): QuotePayload {
  return {
    ...payload,
    warning: payload.warning ? `${payload.warning}；${warning}` : warning,
    error: payload.error ?? warning
  };
}
