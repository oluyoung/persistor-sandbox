import type { StorageEngine } from '../types';

export const noopStorage: StorageEngine = {
  getItem: async () => null,
  setItem: async () => {},
  removeItem: async () => {},
};