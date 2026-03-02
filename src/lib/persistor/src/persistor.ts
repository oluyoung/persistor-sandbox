/* eslint-disable @typescript-eslint/no-explicit-any */
import type { PersistOptions, Persistor, SliceFilter, SliceFilterInput } from './types';
import { applyPluginsLoad, applyPluginsSave } from './plugins/apply';
import { filterSlice, normalizeFilters } from './utils';

export function createPersistor(options: PersistOptions): Persistor {
  const { key, storage, whitelist, blacklist, plugins = [], debounceMs = 300 } = options;

  const ownsStorage = plugins.some(p => p.ownsStorage);
  let lastQueuedState: any = null;
  let debounceTimer: any = null;
  let inFlight = false;
  const whitelistMap = normalizeFilters(
    whitelist as SliceFilterInput[]
  );
  const blacklistMap = normalizeFilters(
    blacklist as SliceFilterInput[]
  );

  async function load() {
    let state: any = null;

    if (!ownsStorage) {
      const raw = await storage?.getItem(key);
      if (raw) {
        state = JSON.parse(raw);
      }
    }

    return applyPluginsLoad(state, plugins);
  }

  async function save(state: any) {
    lastQueuedState = state;

    if (!debounceTimer) {
      debounceTimer = setTimeout(async () => {
        debounceTimer = null;
        await flush();
      }, debounceMs);
    }
  }

  async function flush() {
    if (!lastQueuedState || inFlight) return;
    inFlight = true;

    let next = lastQueuedState;

    if (!ownsStorage) next = filterRootState(next, whitelistMap, blacklistMap);

    next = await applyPluginsSave(next, plugins);

    if (!ownsStorage) {
      await storage?.setItem(key, JSON.stringify(next));
    }

    inFlight = false;
  }

  return { load, save };
}

function filterRootState(
  state: any,
  whitelist?: Map<string, SliceFilter>,
  blacklist?: Map<string, SliceFilter>
) {
  if (!whitelist?.size && !blacklist?.size) {
    return state;
  }

  const next: Record<string, any> = {};

  for (const sliceKey of Object.keys(state)) {
    const whitelisted = whitelist?.has(sliceKey);
    const blacklisted = blacklist?.has(sliceKey);

    if (whitelist?.size && !whitelisted) continue;
    if (blacklisted && !whitelisted) continue;

    const filter =
      whitelist?.get(sliceKey) ??
      blacklist?.get(sliceKey);

    next[sliceKey] = filterSlice(
      state[sliceKey],
      filter
    );
  }

  return next;
}