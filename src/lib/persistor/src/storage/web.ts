import type { StorageEngine } from '../types';

export function createLocalStorage(): StorageEngine {
  const storage = window?.localStorage;

  return {
    async getItem(key) {
      return storage.getItem(key);
    },
    async setItem(key, value) {
      storage.setItem(key, value);
    },
    async removeItem(key) {
      storage.removeItem(key);
    }
  };
}

export function createSessionStorage(): StorageEngine {
  const storage = window?.sessionStorage;

  return {
    async getItem(key) {
      return storage.getItem(key);
    },
    async setItem(key, value) {
      storage.setItem(key, value);
    },
    async removeItem(key) {
      storage.removeItem(key);
    }
  };
}