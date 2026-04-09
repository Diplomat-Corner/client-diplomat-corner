/**
 * Bun / Node with `--localstorage-file` (invalid path) can expose a
 * `globalThis.localStorage` object whose `getItem` is not a function.
 * Clerk (and other libs) call `localStorage.getItem` during SSR and crash.
 *
 * If Node prints: `--localstorage-file was provided without a valid path`,
 * use `pnpm run build` (uses `scripts/run-without-broken-localstorage-flag.mjs`)
 * which sets a valid temp file for Node 25+ workers. Or fix `NODE_OPTIONS` /
 * your shell so `--localstorage-file` has a real path.
 *
 * This installs an in-memory Storage implementation only when running
 * without a real browser `window` and when the existing API is broken.
 */
const memoryStore = new Map<string, string>();

function createMemoryStorage(): Storage {
  return {
    get length() {
      return memoryStore.size;
    },
    clear() {
      memoryStore.clear();
    },
    getItem(key: string) {
      return memoryStore.has(key) ? memoryStore.get(key)! : null;
    },
    key(index: number) {
      const keys = Array.from(memoryStore.keys());
      return index >= 0 && index < keys.length ? keys[index] : null;
    },
    removeItem(key: string) {
      memoryStore.delete(key);
    },
    setItem(key: string, value: string) {
      memoryStore.set(String(key), String(value));
    },
  };
}

export function ensureLocalStoragePolyfill(): void {
  if (typeof window !== "undefined") return;

  const current = (
    globalThis as unknown as { localStorage?: unknown }
  ).localStorage;
  if (current && typeof (current as Storage).getItem === "function") {
    return;
  }

  const storage = createMemoryStorage();
  try {
    (globalThis as unknown as { localStorage: Storage }).localStorage =
      storage;
  } catch {
    try {
      Object.defineProperty(globalThis, "localStorage", {
        value: storage,
        writable: true,
        configurable: true,
      });
    } catch {
      // Last resort: leave as-is if environment forbids patching
    }
  }
}
