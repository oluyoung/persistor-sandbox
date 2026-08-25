import { PersistLite } from './persistor';
import type { PersistOptions } from './types';

export const persistLite = <TState>(
  options: PersistOptions<TState>,
) => new PersistLite(options);
