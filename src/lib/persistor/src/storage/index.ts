import { isReactNative } from '../utils';
import type { StorageEngine } from '../types';
import { createLocalStorage } from './web';
import { createNativeStorage } from './native';

export function createStorageEngine(): StorageEngine {
  return isReactNative() ? createNativeStorage() : createLocalStorage();
}

export type { StorageEngine };