/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Plugin, Options, PersistedSlice } from '../types';
import { compress, decompress, filterSlice, normalizeFilters } from '../utils';

export function slicePersistencePlugin(
  storage: any,
  options: Options = {}
): Plugin {
  const {
    priority = [],
    deferred = [],
    prefix = 'persist:slice:',
    compress: useCompression = false,
    whitelist,
    blacklist,
  } = options;

  const hydrated = new Set<string>();
  const whitelistMap = normalizeFilters(whitelist);
  const blacklistMap = normalizeFilters(blacklist);
  let deferredHydrationScheduled = false;

  async function loadSlice(slice: string): Promise<any | undefined> {
    const raw = await storage.getItem(`${prefix}${slice}`);
    if (!raw) return;

    const parsed: PersistedSlice = JSON.parse(raw);
    hydrated.add(slice);

    if (parsed.meta.compressed && typeof parsed.data === 'string') {
      return decompress(parsed.data);
    }

    return parsed.data;
  }

  return {
    ownsStorage: true,

    /* ---------------- LOAD ---------------- */

    async onLoad(state: any | null) {
      // Root key is ignored — slice plugin owns its own keys
      const indexRaw = await storage.getItem('persist:index');
      if (!indexRaw) return state;

      const slices: string[] = JSON.parse(indexRaw);
      const nextState: any = { ...(state ?? {}) };

      // 1Priority hydration (blocking)
      for (const slice of priority) {
        if (slices.includes(slice)) {
          const data = await loadSlice(slice);
          if (data !== undefined) nextState[slice] = data;
        }
      }

      // Normal hydration (parallel, non-deferred)
      const normalSlices = slices.filter((s) => !priority.includes(s) && !deferred.includes(s));
      const results = await Promise.all(normalSlices.map(loadSlice));
      normalSlices.forEach((slice, i) => {
        const data = results[i];
        if (data !== undefined) nextState[slice] = data;
      });

      // Deferred hydration (background)
      if (deferred.length && !deferredHydrationScheduled) {
        deferredHydrationScheduled = true;

        setTimeout(async () => {
          for (const slice of deferred) {
            if (!hydrated.has(slice)) {
              const data = await loadSlice(slice);
              if (data !== undefined) {
                // At MVP level we DO NOT auto-inject this into the store.
                // The app must call save() after state changes.
                nextState[slice] = data;
              }
            }
          }
        }, 1000); // arbitrary delay to ensure this runs after critical rendering
      }

      return nextState;
    },

    /* ---------------- SAVE ---------------- */

    async onSave(state: any) {
      const slices = Object.keys(state);

      await Promise.all(
        slices.map(async (slice) => {
          const filter = whitelistMap.get(slice) ?? blacklistMap.get(slice);
          const filtered = filterSlice(state[slice], filter);
          const payload: PersistedSlice = {
            data: useCompression
              ? compress(filtered)
              : filtered,
            meta: {
              version: 1,
              updatedAt: Date.now(),
              compressed: useCompression,
            },
          };

          await storage.setItem(
            `${prefix}${slice}`,
            JSON.stringify(payload)
          );
        })
      );

      await storage.setItem(
        'persist:index',
        JSON.stringify(slices)
      );

      return state;
    },
  };
}