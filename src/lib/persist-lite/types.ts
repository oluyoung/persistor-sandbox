export type PersistorStatus = 'idle' | 'loading' | 'loaded' | 'error';

export interface StorageEngine {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export interface Plugin<TState extends Record<string, unknown>> {
  onLoad?: (state: TState) => TState | Promise<TState>;
  onSave?: (state: TState) => TState | Promise<TState>;
  afterLoad?: (state: TState) => TState | Promise<TState>;
}

export interface PersistOptions<TState extends Record<string, unknown>> {
  key: string;
  storage?: StorageEngine;
  whitelist?: (string | SliceFilter)[];
  blacklist?: (string | SliceFilter)[];
  plugins?: Plugin<TState>[];
  debounceMs?: number;
  mergeStrategy?: 'replace' | 'shallow';
}

export interface Persistor<TState extends Record<string, unknown>> {
  load: () => Promise<TState | null>;
  save: (state: TState) => Promise<void>;
  subscribe: (listener: () => void) => () => void;
  purge: (slices?: string[]) => Promise<void>;
  status: PersistorStatus;
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
