import React, { useSyncExternalStore } from 'react';
import type { Persistor } from '../types';
import { PersistorContext } from './context';

interface PersistGateProps<TState extends Record<string, unknown>> {
  persistor: Persistor<TState>;
  loading?: React.ReactNode;
  children: React.ReactNode;
}

export function PersistGate<TState extends Record<string, unknown>>({ persistor, loading = null, children }: PersistGateProps<TState>) {
  const status = useSyncExternalStore(
    persistor.subscribe,
    () => persistor.status,
    () => 'loading' as const,
  );

  const isReady = status === 'loaded' || status === 'error';

  return (
    <PersistorContext.Provider value={persistor as Persistor<Record<string, unknown>>}>
      {/* No loading prop = non-blocking. Children render immediately,
          components use usePersistor to handle their own stale state. */}
      {loading !== undefined && !isReady ? loading : children}
    </PersistorContext.Provider>
  );
}