import type { PersistOptions, /* Persistor, */ SliceFilterInput } from './types';
import { applyPluginsLoad, applyPluginsSave } from './plugins/apply';
import { filterRootState, normalizeFilters } from './utils';
import { createLocalStorage } from './storage/local';

export class PersistLite<TState> {
  key;
  storage;
  whitelist: SliceFilterInput[];
  blacklist: SliceFilterInput[];
  plugins;
  debounceMs;
  lastQueuedState: TState | null = null;
  debounceTimer: number | null = null;
  inFlight = false;

  constructor(options: PersistOptions<TState>) {
    if (options.key) throw new Error('Persist Lite cannot be iniated without a key!');
    this.key = options.key;
    this.storage = options.storage || createLocalStorage(); 
    this.whitelist = options.whitelist || []; 
    this.blacklist = options.blacklist || []; 
    this.plugins = options.plugins || []; 
    this.debounceMs = options.debounceMs || 300;
  }

  async load() {
    let state = null;

    const raw = await this.storage.getItem(this.key);
    if (raw) state = JSON.parse(raw);

    return applyPluginsLoad(state, this.plugins);
  }

  async save(state: TState) {
    this.lastQueuedState = state;

    if (!this.debounceTimer) {
      this.debounceTimer = setTimeout(async () => {
        this.debounceTimer = null;
        await this.flush();
      }, this.debounceMs);
    }
  }

  private async flush() {
    if (!this.lastQueuedState || this.inFlight) return;
    this.inFlight = true;

    let next = filterRootState<TState>(this.lastQueuedState, this.whitelistMap, this.blacklistMap);
    next = await applyPluginsSave(next, this.plugins);
    await this.storage?.setItem(this.key, JSON.stringify(next));

    this.inFlight = false;
  }

  get whitelistMap() {
    return normalizeFilters(this.whitelist);
  }

  get blacklistMap() {
    return normalizeFilters(this.blacklist);
  }
}

/*
export const createPersistor = <TState>(options: PersistOptions<TState>): Persistor<TState> => {
  const { key, storage, whitelist, blacklist, plugins = [], debounceMs = 300 } = options;

  let lastQueuedState: any = null;
  let debounceTimer: number | null = null;
  let inFlight = false;
  const whitelistMap = normalizeFilters(
    whitelist as SliceFilterInput[]
  );
  const blacklistMap = normalizeFilters(
    blacklist as SliceFilterInput[]
  );

  async function load() {
    let state: any = null;

    const raw = await storage?.getItem(key);
    if (raw) state = JSON.parse(raw);

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

    let next = filterRootState(lastQueuedState, whitelistMap, blacklistMap);
    next = await applyPluginsSave(next, plugins);
    await storage?.setItem(key, JSON.stringify(next));

    inFlight = false;
  }

  return { load, save };
}
*/