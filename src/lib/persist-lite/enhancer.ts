import type { Dispatch, StoreEnhancer } from 'redux';
import { PersistLite } from './persistor';
import { rehydrate } from './actions';

export function createPersistorEnhancer<TState extends Record<string, unknown>>(
  persistor: PersistLite<TState>,
): StoreEnhancer {
  return (createStore) =>
    (...args) => {
      const store = createStore(...args);

      // Wire save on every state change
      store.subscribe(() => persistor.save(store.getState() as TState));

      // Kick off rehydration — PersistGate gates loading until this resolves
      persistor.load().then((savedState) => {
        if (savedState) (store.dispatch as Dispatch)(rehydrate(savedState));
        persistor.setLoaded();
      });

      return store;
    };
}
