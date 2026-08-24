import type {
  PersistOptions,
  PersistorStatus,
  SliceFilterInput,
  StorageEngine,
  StorageEnvelope,
} from './types';
import { applyPluginsLoad, applyPluginsSave } from './plugins/apply';
import type { Plugin } from './types';
import { filterRootState, normalizeFilters } from './utils';
import { createStorageEngine } from './storage';

export class PersistLite<TState extends Record<string, unknown>> {
  private readonly key: string;
  private readonly storage: StorageEngine;
  private readonly whitelist: SliceFilterInput[];
  private readonly blacklist: SliceFilterInput[];
  private readonly plugins: Plugin<TState>[];
  private readonly debounceMs: number;
  private readonly version: number;
  private readonly ttl: number | undefined;

  private _inFlight = false;
  private _isPurging = false;
  private _lastQueuedState: TState | null = null;
  private _debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private _status: PersistorStatus = "idle";
  private _listeners = new Set<() => void>();
  private _firstTimestamp: number | null = null;

  constructor(options: PersistOptions<TState>) {
    if (!options.key)
      throw new Error("Persist Lite cannot be iniated without a key!");

    this.key = options.key;
    this.storage = options.storage || createStorageEngine();
    this.whitelist = options.whitelist || [];
    this.blacklist = options.blacklist || [];
    this.plugins = options.plugins || [];
    this.debounceMs = options.debounceMs || 300;
    this.version = options.version || 1;
    this.ttl = options.ttl;
  }

  load = async () => {
    this._setStatus("loading");
    try {
      let state = null;
      const raw = await this.storage.getItem(this.key);
      if (raw) {
        const envelope = JSON.parse(raw) as StorageEnvelope<TState>;

        // Version mismatch → clear and start fresh
        if (envelope._v !== this.version) {
          await this.storage.removeItem(this.key);
          return null;
        }

        // TTL expired → evict
        if (this.ttl !== undefined && Date.now() - envelope._ts > this.ttl) {
          await this.storage.removeItem(this.key);
          return null;
        }

        this._firstTimestamp = envelope._ts;
        state = envelope._d;
      }

      const loaded = await applyPluginsLoad<TState>(state, this.plugins);
      return loaded as TState | null;
    } catch (error) {
      console.error("Failed to load persisted state:", error);
      this._setStatus("error");
      return null;
    }
  }

  save = async (state: TState) =>{
    this._lastQueuedState = state;
    if (!this._debounceTimer) {
      this._debounceTimer = setTimeout(() => {
        this._debounceTimer = null;
        this.flush();
      }, this.debounceMs);
    }
  }

  purge = async (slices?: string[]) => {
    this._isPurging = true;

    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
      this._debounceTimer = null;
    }
    
    try {
      if (!slices) {
        await this.storage?.removeItem(this.key);
      } else {
        const raw = await this.storage?.getItem(this.key);
        if (!raw) return;
        const envelope = JSON.parse(raw) as StorageEnvelope<Record<string, unknown>>;
        const state = { ...envelope._d };
        slices.forEach((s) => delete state[s]);

        await this.storage?.setItem(this.key, JSON.stringify({
          ...envelope,
           _d: state,
        }));
      }
    } finally {
      this._lastQueuedState = null;
      this._isPurging = false;
      if (!slices) this._firstTimestamp = null;
    }
  }

  subscribe = (listener: () => void) => {
    this._listeners.add(listener);
    return () => {
      this._listeners.delete(listener);
    };
  };

  setLoaded = () => {
    this._setStatus("loaded");
  }

  get status() {
    return this._status;
  }

  flush = async () => {
    if (!this._lastQueuedState || this._inFlight || this._isPurging) return;
    this._inFlight = true;

    const stateToPersist = this._lastQueuedState;
    this._lastQueuedState = null;

    try {
      let next = filterRootState<TState>(
        stateToPersist,
        normalizeFilters(this.whitelist),
        normalizeFilters(this.blacklist),
      );
      next = await applyPluginsSave(next, this.plugins);

      if (this._firstTimestamp === null) this._firstTimestamp = Date.now();

      const envelope: StorageEnvelope<TState> = {
        _v: this.version,
        _ts: this._firstTimestamp,
        _d: next,
      };

      await this.storage?.setItem(this.key, JSON.stringify(envelope));
    } catch (error) {
      console.error("Failed to persist state:", error);
    } finally {
      this._inFlight = false;
      if (this._lastQueuedState) await this.flush();
    }
  }

  private _setStatus = (status: PersistorStatus) => {
    this._status = status;
    this._listeners.forEach((l) => l());
  };
}
