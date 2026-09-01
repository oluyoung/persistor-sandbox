import type {
  PersistOptions,
  PersistorStatus,
  SliceFilterInput,
  StorageEngine,
  StorageEnvelope,
} from "./types";
import { applyPluginsLoad, applyPluginsSave } from "./plugins/apply";
import type { Plugin } from "./types";
import {
  filterRootState,
  isFilterableRootState,
  normalizeFilters,
} from "./utils";
import { createStorageEngine } from "./storage";

export class PersistLite<TState> {
  private readonly key: string;
  private readonly storage: StorageEngine;
  private readonly whitelist: readonly SliceFilterInput<TState>[];
  private readonly blacklist: readonly SliceFilterInput<TState>[];
  private readonly plugins: Plugin<TState>[];
  private readonly debounceMs: number;
  private readonly version: number;
  private readonly ttl: number | undefined;

  private _inFlight = false;
  private _isPurging = false;
  private _lastQueuedState: TState | undefined = undefined;
  private _debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private _status: PersistorStatus = "idle";
  private _listeners = new Set<() => void>();
  private _firstTimestamp: number | null = null;

  constructor(options: PersistOptions<TState>) {
    if (!options.key)
      throw new Error("Persist Lite cannot be iniated without a key!");

    this.key = options.key;
    this.storage = options.storage || createStorageEngine();
    this.whitelist = options.whitelist ?? [];
    this.blacklist = options.blacklist ?? [];
    this.plugins = options.plugins || [];
    this.debounceMs = options.debounceMs || 300;
    this.version = options.version || 1;
    this.ttl = options.ttl;
  }

  load = async (): Promise<TState | undefined> => {
    this._setStatus("loading");
    try {
      let state: TState | undefined = undefined;
      const raw = await this.storage.getItem(this.key);
      if (raw !== null) {
        const envelope = JSON.parse(raw) as StorageEnvelope<TState>;

        // Version mismatch → clear and start fresh
        if (envelope._v !== this.version) {
          await this.storage.removeItem(this.key);
          return undefined;
        }

        // TTL expired → evict
        if (this.ttl !== undefined && Date.now() - envelope._ts > this.ttl) {
          await this.storage.removeItem(this.key);
          return undefined;
        }

        this._firstTimestamp = envelope._ts;
        state = envelope._d;
      }

      const loaded = await applyPluginsLoad<TState>(state, this.plugins);
      return loaded as TState | undefined;
    } catch (error) {
      console.error("Failed to load persisted state:", error);
      this._setStatus("error");
      return undefined;
    }
  };

  save = async (state: TState) => {
    this._lastQueuedState = state;
    if (!this._debounceTimer) {
      this._debounceTimer = setTimeout(() => {
        this._debounceTimer = null;
        this.flush();
      }, this.debounceMs);
    }
  };

  purge = async (slices?: string[]) => {
    this._isPurging = true;

    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
      this._debounceTimer = null;
    }

    try {
      if (!slices) {
        await this.storage?.removeItem(this.key);
        return;
      }

      const raw = await this.storage?.getItem(this.key);
      if (raw === null) return;

      const envelope = JSON.parse(raw) as StorageEnvelope<TState>;

      if (!isFilterableRootState(envelope._d)) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            "[persist-lite] Partial purge is only supported " +
              "for object root states. Use purge() to clear " +
              "a primitive or array root state.",
          );
        }
        return;
      }

      const nextState = { ...envelope._d };
      for (const slice of slices) {
        delete nextState[slice];
      }

      await this.storage?.setItem(
        this.key,
        JSON.stringify({
          ...envelope,
          _d: nextState,
        }),
      );
    } finally {
      this._lastQueuedState = undefined;
      this._isPurging = false;
      if (!slices) this._firstTimestamp = null;
    }
  };

  subscribe = (listener: () => void) => {
    this._listeners.add(listener);
    return () => {
      this._listeners.delete(listener);
    };
  };

  setLoaded = () => {
    this._setStatus("loaded");
  };

  get status() {
    return this._status;
  }

  flush = async () => {
    if (
      this._lastQueuedState === undefined ||
      this._inFlight ||
      this._isPurging
    )
      return;
    this._inFlight = true;

    const stateToPersist = this._lastQueuedState;
    this._lastQueuedState = undefined;

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
      if (this._lastQueuedState !== undefined) await this.flush();
    }
  };

  private _setStatus = (status: PersistorStatus) => {
    this._status = status;
    this._listeners.forEach((l) => l());
  };
}
