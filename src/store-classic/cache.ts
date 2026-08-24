/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AnyAction } from 'redux';

interface CacheState {
  cache: any;
}

const initialState: CacheState = {
  cache: [],
};

export const SET_CACHE = 'cache/setCache';

export function setCache(payload: any) {
  return {
    type: SET_CACHE,
    payload,
  };
}

export default function cacheReducer(
  state: CacheState = initialState,
  action: AnyAction
): CacheState {
  switch (action.type) {
    case SET_CACHE:
      return {
        ...state,
        cache: action.payload,
      };
    default:
      return state;
  }
}
