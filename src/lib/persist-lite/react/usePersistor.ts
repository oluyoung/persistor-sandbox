import { useContext } from 'react';
import { PersistorContext } from './context';

export function usePersistor() {
  const persistor = useContext(PersistorContext);
  if (!persistor) {
    throw new Error('usePersistor must be called inside a <PersistGate>');
  }
  return persistor;
}