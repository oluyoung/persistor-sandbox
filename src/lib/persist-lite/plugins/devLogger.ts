import type { Plugin } from '../types';

export function devLogger<TState extends Record<string, unknown>>(): Plugin<TState> {
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
        Object.keys(state)
      );
      return state;
    },

    async afterLoad(state) {
      console.timeEnd('[persist] hydration');
      console.log(
        '[persist] hydrated slices',
        Object.keys(state ?? {})
      );
      console.groupEnd();
      return state;
    },
  };
}