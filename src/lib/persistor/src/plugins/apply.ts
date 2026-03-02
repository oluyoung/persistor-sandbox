/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Plugin } from '../types';

export async function applyPluginsLoad(state: any, plugins: Plugin[]) {
  let result = state;
  for (const plugin of plugins) {
    if (plugin.onLoad) result = await plugin.onLoad(result);
    if (plugin.afterLoad) result = await plugin.afterLoad(result);
  }
  return result;
}

export async function applyPluginsSave(state: any, plugins: Plugin[]) {
  let result = state;
  for (const plugin of plugins) {
    if (plugin.onSave) result = await plugin.onSave(result);
  }
  return result;
}