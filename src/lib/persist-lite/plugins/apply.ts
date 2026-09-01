import type { Plugin } from '../types';

// Note: Plugins are applied in order
export const applyPluginsLoad = async <TState>(state: TState | undefined, plugins: Plugin<TState>[]): Promise<TState | undefined> => {
  if (state === undefined) return undefined;

  let result: TState = state;
  for (const plugin of plugins) {
    if (plugin.onLoad) result = await plugin.onLoad(result);
    if (plugin.afterLoad) result = await plugin.afterLoad(result);
  }
  return result;
}

export const applyPluginsSave = async <TState>(state: TState, plugins: Plugin<TState>[]): Promise<TState> => {
  let result = state;
  for (const plugin of plugins) {
    if (plugin.onSave) result = await plugin.onSave(result);
  }
  return result;
};
