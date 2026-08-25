import {
  applyMiddleware,
  combineReducers,
  compose,
  legacy_createStore as createStore,
  type StoreEnhancer,
} from 'redux';
import { thunk } from 'redux-thunk';

import {
  persistLite,
  createPersistorEnhancer,
  withPersistRehydration,
} from '../lib/persist-lite';

import cacheReducer from './cache'
import userReducer from './user'

const rootReducer = combineReducers({
  user: userReducer,
  cache: cacheReducer,
});

export type RootState =
  ReturnType<typeof rootReducer>;

const persistor =
  persistLite<RootState>({
    key: 'classic-app',
    whitelist: ['user'],
  });

const persistedReducer = withPersistRehydration(rootReducer);

const enhancer = compose(
  applyMiddleware(thunk),
  createPersistorEnhancer(persistor),
) as StoreEnhancer;

const store = createStore(persistedReducer, enhancer);

export { store, persistor };

export type ReduxRootStore = typeof store;
export type AppDispatch = ReduxRootStore["dispatch"];