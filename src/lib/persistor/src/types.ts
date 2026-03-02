/* eslint-disable @typescript-eslint/no-explicit-any */
export interface StorageEngine {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export interface Plugin {
  ownsStorage?: boolean; // if true, plugin is responsible for its own storage management and is not passed the full state
  onLoad?: (state: any) => any | Promise<any>;
  onSave?: (state: any) => any | Promise<any>;
  afterLoad?: (state: any) => any | Promise<any>;
}

export interface PersistOptions {
  key: string;
  storage?: StorageEngine;
  whitelist?: (string | SliceFilter)[];
  blacklist?: (string | SliceFilter)[];
  plugins?: Plugin[];
  debounceMs?: number;
}

export interface Persistor {
  load: () => Promise<any>;
  save: (state: any) => Promise<void>;
}

export interface PersistedSlice<T = any> {
  data: T | string;
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