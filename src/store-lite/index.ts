import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import userReducer from './user.slice';
import cacheReducer from './cache.slice';
import { devLogger, persistLite } from '../lib/persist-lite';
import { createPersistorEnhancer } from '../lib/persist-lite/enhancer';

const rootReducer = combineReducers({
  user: userReducer,
  cache: cacheReducer,
});

// RootState is now derivable before the store exists
export type RootState = ReturnType<typeof rootReducer>;

export const persistor = persistLite<RootState>({
  key: 'lite-root',
  debounceMs: 300,
  plugins: [devLogger()],
  whitelist: [{ key: 'user', whitelistKeys: ['me', 'count']}],
  // whitelist: ['user'],
  // blacklist: [{ key: 'cache', blacklistKeys: ['temp']}],
   // Only persist the user slice
   version: 1,
   ttl: 1 * 60 * 1000, // 1 minute
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createAppStore(preloadedState?: any) {
  const store = configureStore({
    reducer: rootReducer,
    ...(preloadedState ? { preloadedState } : {}),
    middleware: (getDefaultMiddleware) => getDefaultMiddleware(),
    enhancers: (getDefaultEnhancers) => getDefaultEnhancers().concat(createPersistorEnhancer(persistor)),
  });
  setupListeners(store.dispatch);
  return store;
}

// export type RootState = ReturnType<
//   ReturnType<typeof createAppStore>['getState']
// >;

export type ReduxRootStore = ReturnType<typeof createAppStore>;
export type AppDispatch = ReduxRootStore["dispatch"];
