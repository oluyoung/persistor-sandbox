import type { StorageEngine } from '../types';

export const createSessionStorage = (): StorageEngine => {
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