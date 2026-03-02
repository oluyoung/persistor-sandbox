import type { Plugin } from '../types';
import pako from 'pako';

export function compressionPlugin(): Plugin {
  return {
    onSave(state) {
      const json = JSON.stringify(state);
      const compressed = pako.deflate(json);
      return compressed;
    },
    onLoad(raw) {
      try {
        const inflated = pako.inflate(raw, { to: 'string' });
        return JSON.parse(inflated);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        console.error(e);
        return raw; // fallback if not compressed
      }
    }
  };
}