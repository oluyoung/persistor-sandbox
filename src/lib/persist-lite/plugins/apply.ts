import type { Plugin } from '../types';

// Note: Plugins are applied in order
export const applyPluginsLoad = async <TState>(state: TState, plugins: Plugin<TState>[]): Promise<TState> => {
  let result = state;
  for (const plugin of plugins) {
    if (plugin.onLoad) result = await plugin.onLoad(result);
    if (plugin.afterLoad) result = await plugin.afterLoad(result);
  }
  return result;
}

export async function applyPluginsSave<TState>(state: TState, plugins: Plugin<TState>[]): Promise<TState> {
  let result = state;
  for (const plugin of plugins) {
    if (plugin.onSave) result = await plugin.onSave(result);
  }
  return result;
}