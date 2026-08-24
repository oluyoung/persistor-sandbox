import { useContext, useSyncExternalStore } from 'react';
import { PersistorContext } from './context';

export function usePersistor() {
  const persistor = useContext(PersistorContext);
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