let fetcher: typeof globalThis.fetch | null = null;
let initDone = false;

function isTauri(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof (window as Record<string, unknown>).__TAURI_INTERNALS__ !== "undefined"
  );
}

async function resolveFetcher(): Promise<typeof globalThis.fetch> {
  if (initDone && fetcher) return fetcher;

  if (isTauri()) {
    try {
      const mod = await import("@tauri-apps/plugin-http");
      fetcher = mod.fetch;
    } catch {
      // Plugin no disponible → fallback al fetch del WebView
      fetcher = globalThis.fetch.bind(globalThis);
    }
  } else {
    // Web plano: usar fetch nativo sin tocar el plugin de Tauri
    fetcher = globalThis.fetch.bind(globalThis);
  }

  initDone = true;
  return fetcher!;
}

export async function crossFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const f = await resolveFetcher();
  return f(input, init);
}
