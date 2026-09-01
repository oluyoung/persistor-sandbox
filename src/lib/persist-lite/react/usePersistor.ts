import { useContext, useSyncExternalStore } from 'react';
import { getPersistorContext } from './context';

export function usePersistor<TState = unknown>() {
  const persistor = useContext(getPersistorContext<TState>());
  if (!persistor) {
    throw new Error('usePersistor must be called inside a <PersistGate>');
  }

  const status = useSyncExternalStore(
    persistor.subscribe,
    () => persistor.status,
    () => 'loading' as const, // SSR snapshot
  );
  return {
    persistor,
    status,
    isHydrated: status === 'loaded',
  };;
}