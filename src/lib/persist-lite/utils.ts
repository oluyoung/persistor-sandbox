import type { SliceFilterInput } from "./types";

interface NormalizedSliceFilter {
  key: string;
  whitelistKeys?: readonly string[];
  blacklistKeys?: readonly string[];
}

export function isFilterableRootState(
  value: unknown,
): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}

export function normalizeFilters<TState>(
  list?: readonly SliceFilterInput<TState>[],
): Map<string, NormalizedSliceFilter> {
  const map = new Map<string, NormalizedSliceFilter>();

  for (const entry of list ?? []) {
    if (typeof entry === "string") {
      map.set(entry, {
        key: entry,
      });

      continue;
    }

    const key = String(entry.key);

    map.set(key, {
      key,
      whitelistKeys: entry.whitelistKeys?.map(String),

      blacklistKeys: entry.blacklistKeys?.map(String),
    });
  }

  return map;
}

function filterSlice(slice: unknown, filter?: NormalizedSliceFilter): unknown {
  if (!filter) {
    return slice;
  }

  if (!isFilterableRootState(slice)) {
    return slice;
  }

  let next: Record<string, unknown> = slice;

  if (filter.whitelistKeys?.length) {
    next = Object.fromEntries(
      filter.whitelistKeys
        .filter((key) => Object.prototype.hasOwnProperty.call(slice, key))
        .map((key) => [key, slice[key]]),
    );
  }

  if (filter.blacklistKeys?.length) {
    next = {
      ...next,
    };

    for (const key of filter.blacklistKeys) {
      delete next[key];
    }
  }

  return next;
}

export function filterRootState<TState>(
  state: TState,
  whitelist?: Map<string, NormalizedSliceFilter>,
  blacklist?: Map<string, NormalizedSliceFilter>,
): TState {
  if (!whitelist?.size && !blacklist?.size) {
    return state;
  }

  if (!isFilterableRootState(state)) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[persist-lite] whitelist/blacklist filtering " +
          "was configured for a non-object root state. " +
          "The filters have been ignored.",
      );
    }

    return state;
  }

  const next: Record<string, unknown> = {};

  for (const [sliceKey, sliceState] of Object.entries(state)) {
    const whitelistFilter = whitelist?.get(sliceKey);
    const blacklistFilter = blacklist?.get(sliceKey);
    const whitelisted = whitelistFilter !== undefined;
    const blacklisted = blacklistFilter !== undefined;

    if (whitelist?.size && !whitelisted) {
      continue;
    }

    /**
     * Whitelist overrides when both contain the slice.
     */
    if (blacklisted && !whitelisted) {
      continue;
    }

    const filter = whitelistFilter ?? blacklistFilter;
    next[sliceKey] = filterSlice(sliceState, filter);
  }

  return next as TState;
}
