import type { Plugin } from '../types';
import { isFilterableRootState } from '../utils';

export function devLogger<TState>(): Plugin<TState> {
  if (process.env.NODE_ENV === 'production') {
    return {};
  }

  return {
    async onLoad(state) {
      console.groupCollapsed('[persist] hydrate start');
      console.time('[persist] hydration');
      return state;
    },

    async onSave(state) {
      console.log(
        '[persist] save triggered',
        isFilterableRootState(state) ? Object.keys(state) : state
      );
      return state;
    },

    async afterLoad(state) {
      console.timeEnd('[persist] hydration');
      console.log(
        '[persist] hydrated slices',
        isFilterableRootState(state) ? Object.keys(state) : state
      );
      console.groupEnd();
      return state;
    },
  };
}