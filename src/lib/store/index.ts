import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import userReducer from "./user.slice";
import cacheReducer from "./cache.slice";
import { persistLite } from '../persistor/src';
import { compressionPlugin } from "../persistor/src/plugins/compress";
import { devLoggerPlugin } from "../persistor/src/plugins/devLogger";
// import { slicePersistencePlugin } from "../persistor/src/plugins/perSlice"; // Needs work

export const persister = persistLite({
  key: 'spa-root',
  debounceMs: 300,
  plugins: [devLoggerPlugin(), compressionPlugin()],
  whitelist: [{ key: 'user', whitelistKeys: ['me', 'count']}], // Only persist the user slice
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
  });
  setupListeners(store.dispatch);
  return store;
}

export type RootState = ReturnType<
  ReturnType<typeof createAppStore>['getState']
>;

export type ReduxRootStore = ReturnType<typeof createAppStore>;
export type AppDispatch = ReduxRootStore["dispatch"];
