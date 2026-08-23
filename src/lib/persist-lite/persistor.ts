import type {
  PersistOptions,
  PersistorStatus,
  SliceFilterInput,
} from './types';
import { applyPluginsLoad, applyPluginsSave } from './plugins/apply';
import type { Plugin } from './types';
import { filterRootState, normalizeFilters } from './utils';
import { createLocalStorage } from './storage/local';

export class PersistLite<TState extends Record<string, unknown>> {
  key;
  storage;
  whitelist: SliceFilterInput[];
  blacklist: SliceFilterInput[];
  plugins: Plugin<TState>[];
  debounceMs: number;
  mergeStrategy: "replace" | "shallow";

  private _inFlight = false;
  private _lastQueuedState: TState | null = null;
  private _debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private _status: "idle" | "loading" | "loaded" | "error" = "idle";
  private _listeners = new Set<() => void>();

  constructor(options: PersistOptions<TState>) {
    if (!options.key)
      throw new Error("Persist Lite cannot be iniated without a key!");
    this.key = options.key;
    this.storage = options.storage || createLocalStorage();
    this.whitelist = options.whitelist || [];
    this.blacklist = options.blacklist || [];
    this.plugins = options.plugins || [];
    this.debounceMs = options.debounceMs || 300;
    this.mergeStrategy = options.mergeStrategy || "replace";
  }

  load = async () => {
    this._setStatus("loading");
    try {
      let state = null;
      const raw = await this.storage.getItem(this.key);
      if (raw) state = JSON.parse(raw);
      const loaded = await applyPluginsLoad<TState>(state, this.plugins);
      this._setStatus("loaded");
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
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
      this._debounceTimer = null;
    }

    if (!slices) {
      await this.storage?.removeItem(this.key);
      return;
    }

    // partial purge: load, delete keys, re-save
    const raw = await this.storage?.getItem(this.key);
    if (!raw) return;

    const state = JSON.parse(raw) as Record<string, unknown>;
    slices.forEach((s) => delete state[s]);
    await this.storage?.setItem(this.key, JSON.stringify(state));
  }

  subscribe = (listener: () => void) => {
    this._listeners.add(listener);
    return () => {
      this._listeners.delete(listener);
    };
  };

  get status() {
    return this._status;
  }

  private flush = async () => {
    if (!this._lastQueuedState || this._inFlight) return;
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
      await this.storage?.setItem(this.key, JSON.stringify(next));
    } catch (error) {
      console.error("Failed to persist state:", error);
    } finally {
      if (this._lastQueuedState) await this.flush();
      this._inFlight = false;
    }
  }

  private _setStatus = (next: PersistorStatus) => {
    this._status = next;
    this._listeners.forEach((l) => l());
  };
}
