import { PersistLite } from './persistor';
import type { PersistOptions } from './types';

export const persistLite = <TState extends Record<string, unknown>>(
  options: PersistOptions<TState>,
) => new PersistLite(options);
