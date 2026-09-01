import React, { useSyncExternalStore } from 'react';
import type { Persistor } from '../types';
import { getPersistorContext } from './context';

interface PersistGateProps<TState> {
  persistor: Persistor<TState>;
  loading?: React.ReactNode;
  children: React.ReactNode;
}


export function PersistGate<TState>({ persistor, loading = null, children }: PersistGateProps<TState>) {
  const PersistorContext = getPersistorContext<TState>();
  const status = useSyncExternalStore(
    persistor.subscribe,
    () => persistor.status,
    () => 'loading' as const,
  );

  const isReady = status === 'loaded' || status === 'error';

  return (
    <PersistorContext.Provider value={persistor as Persistor<TState>}>
      {loading !== undefined && !isReady ? loading : children}
    </PersistorContext.Provider>
  );
}