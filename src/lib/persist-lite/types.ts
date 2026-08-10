export interface StorageEngine {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export interface Plugin<TState> {
  onLoad?: (state: TState) => TState | Promise<TState>;
  onSave?: (state: TState) => TState | Promise<TState>;
  afterLoad?: (state: TState) => TState | Promise<TState>;
}

export interface PersistOptions<TState> {
  key: string;
  storage?: StorageEngine;
  whitelist?: (string | SliceFilter)[];
  blacklist?: (string | SliceFilter)[];
  plugins?: Plugin<TState>[];
  debounceMs?: number;
}

export interface Persistor<TState> {
  load: () => Promise<TState>;
  save: (state: TState) => Promise<void>;
}

export interface PersistedSlice<TSlice> {
  data: TSlice | string;
  meta: {
    version: number;
    updatedAt: number;
    compressed?: boolean;
  };
}

export interface SliceFilter {
  key: string;
  whitelistKeys?: string[];
  blacklistKeys?: string[];
}

export type SliceFilterInput = string | SliceFilter;

export interface Options {
  priority?: string[];
  deferred?: string[];
  prefix?: string;
  compress?: boolean;
  whitelist?: SliceFilterInput[];
  blacklist?: SliceFilterInput[];
}
