



const MAX_ENTRIES = 100;

interface CacheEntry {
  data: unknown;
  key: string;
}

const _store = new Map<string, CacheEntry>();

function touch(key: string): void {
  const entry = _store.get(key);
  if (entry) {
    
    _store.delete(key);
    _store.set(key, entry);
  }
}

function evict(): void {
  if (_store.size <= MAX_ENTRIES) return;
  const oldest = _store.keys().next().value;
  if (oldest != null) _store.delete(oldest);
}


export function cacheGet<T>(key: string): T | null {
  touch(key);
  const entry = _store.get(key);
  return entry ? (entry.data as T) : null;
}


export function cacheSet(key: string, data: unknown): void {
  _store.set(key, { data, key });
  evict();
}


export function cacheClear(prefix?: string): void {
  if (!prefix) {
    _store.clear();
    return;
  }
  for (const key of _store.keys()) {
    if (key.startsWith(prefix)) _store.delete(key);
  }
}


export function cacheKey(...parts: (string | number | undefined | null)[]): string {
  return parts.filter((p) => p != null && p !== "").join(":");
}
