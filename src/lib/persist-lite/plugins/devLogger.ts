import type { Plugin } from '../types';

export function devLoggerPlugin<TState extends Record<string, unknown>>(
  enabled = process.env.NODE_ENV !== 'production'
): Plugin<TState> {
  if (!enabled) {
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