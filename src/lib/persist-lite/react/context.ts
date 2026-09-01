import { createContext } from 'react';
import type { Persistor } from '../types';

export const PersistorContext = createContext<Persistor<unknown> | null>(null);

export type PersistorContextType<TState> = React.Context<
  Persistor<TState> | null
>;

export const getPersistorContext = <TState>() =>
  PersistorContext as PersistorContextType<TState>;
