export type PersistorStatus = 'idle' | 'loading' | 'loaded' | 'error';

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

export type StringKeyOf<T> =
  Extract<keyof T, string>;

export type NestedStringKeyOf<T> =
  T extends readonly unknown[]
    ? never
    : T extends object
      ? Extract<keyof T, string>
      : never;

type PersistFilterOptions<TState> =
  TState extends Record<string, unknown>
    ? {
        whitelist?: SliceFilterInput<TState>[];
        blacklist?: SliceFilterInput<TState>[];
      }
    : {
        whitelist?: never;
        blacklist?: never;
      };

export type PersistOptions<TState> = {
  key: string;
  storage?: StorageEngine;
  plugins?: Plugin<TState>[];
  debounceMs?: number;
  version?: number; // defaults to 1; mismatch with stored _v clears storage
  ttl?: number; // milliseconds
} & PersistFilterOptions<TState>;

export interface Persistor<TState> {
  load: () => Promise<TState | undefined>;
  save: (state: TState) => Promise<void>;
  subscribe: (listener: () => void) => () => void;
  purge: (slices?: string[]) => Promise<void>;
  status: PersistorStatus;
  flush: () => Promise<void>;
}

// export interface SliceFilter<TState> {
//   key: keyof TState;
//   whitelistKeys?: string[];
//   blacklistKeys?: string[];
// }

export type SliceFilter<TState> = {
  [K in StringKeyOf<TState>]: {
    key: K;
    whitelistKeys?: readonly NestedStringKeyOf<
      TState[K]
    >[];
    blacklistKeys?: readonly NestedStringKeyOf<
      TState[K]
    >[];
  };
}[StringKeyOf<TState>];

// export type SliceFilterInput<TState> = string | SliceFilter<TState>;

export type SliceFilterInput<TState> =
  | StringKeyOf<TState>
  | SliceFilter<TState>;

export interface StorageEnvelope<TState> {
  _v: number;
  _ts: number;
  _d: TState;
}
