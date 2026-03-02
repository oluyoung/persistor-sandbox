import { createPersistor } from './persistor';
import { createStorageEngine, type StorageEngine } from './storage';
import type { Plugin, PersistOptions, Persistor } from './types';

export interface PersistLiteOptions extends PersistOptions {
  storage?: StorageEngine;
  plugins?: Plugin[];
}

export function persistLite(options: PersistLiteOptions): Persistor {
  const storage = options.storage ?? createStorageEngine();
  return createPersistor({ ...options, storage });
}

export * from './types';