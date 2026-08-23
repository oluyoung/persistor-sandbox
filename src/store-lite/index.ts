import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import userReducer from './user.slice';
import cacheReducer from './cache.slice';
import { persistLite } from '../lib/persist-lite';
import { createPersistorEnhancer } from '../lib/persist-lite/enhancer';

export const persistor = persistLite({
  key: 'lite-root',
  debounceMs: 300,
  // plugins: [],
  whitelist: [{ key: 'user', whitelistKeys: ['me', 'count']}],
  // whitelist: ['user'],
  // blacklist: [{ key: 'cache', blacklistKeys: ['temp']}],
   // Only persist the user slice
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createAppStore(preloadedState?: any) {
  const store = configureStore({
    reducer: combineReducers({
      user: userReducer,
      cache: cacheReducer,
    }),
    ...(preloadedState ? { preloadedState } : {}),
    middleware: (getDefaultMiddleware) => getDefaultMiddleware(),
    enhancers: (getDefaultEnhancers) => getDefaultEnhancers().concat(createPersistorEnhancer(persistor)),
  });
  setupListeners(store.dispatch);
  return store;
}

export type RootState = ReturnType<
  ReturnType<typeof createAppStore>['getState']
>;

export type ReduxRootStore = ReturnType<typeof createAppStore>;
export type AppDispatch = ReduxRootStore["dispatch"];
