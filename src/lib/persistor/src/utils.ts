/* eslint-disable @typescript-eslint/no-explicit-any */
import pako from 'pako';
import type { SliceFilter, SliceFilterInput } from './types';

export function isReactNative(): boolean {
  return typeof navigator !== 'undefined' &&
    navigator.product === 'ReactNative';
}

export function normalizeFilters(list?: SliceFilterInput[]) {
  const map = new Map<string, SliceFilter>();

  for (const entry of list ?? []) {
    if (typeof entry === 'string') {
      map.set(entry, { key: entry });
    } else {
      map.set(entry.key, entry);
    }
  }

  return map;
}

export function filterSlice(
  slice: any,
  filter?: SliceFilter
) {
  if (!filter) return slice;

  let next = slice;

  if (filter.whitelistKeys?.length) {
    next = Object.fromEntries(
      filter.whitelistKeys
        .filter(k => k in slice)
        .map(k => [k, slice[k]])
    );
  }

  if (filter.blacklistKeys?.length) {
    next = { ...next };
    for (const key of filter.blacklistKeys) {
      delete next[key];
    }
  }

  return next;
}

export function compress(value: any) {
  return pako.deflate(JSON.stringify(value));
}

export function decompress(raw: any) {
  try {
    const inflated = pako.inflate(raw, { to: 'string' });
    return JSON.parse(inflated);
  } catch (e: any) {
    console.error(e);
    return raw; // fallback if not compressed
  }
}
