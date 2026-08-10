import type { SliceFilter, SliceFilterInput } from './types';

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

function filterSlice(
  slice: Record<string, unknown>,
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

export function filterRootState<TState>(
  state: TState,
  whitelist?: Map<string, SliceFilter>,
  blacklist?: Map<string, SliceFilter>
) {
  if (!whitelist?.size && !blacklist?.size) {
    return state;
  }

  const next = {} as TState;

  for (const sliceKey of Object.keys(state)) {
    const whitelisted = whitelist?.has(sliceKey);
    const blacklisted = blacklist?.has(sliceKey);

    if (whitelist?.size && !whitelisted) continue;
    if (blacklisted && !whitelisted) continue;

    const filter =
      whitelist?.get(sliceKey) ??
      blacklist?.get(sliceKey);

    next[sliceKey] = filterSlice(
      state[sliceKey] as Record<string, unknown>,
      filter
    );
  }

  return next;
}
