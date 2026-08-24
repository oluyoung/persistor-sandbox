# Redux Persist Lite sandbox

Lightweight, type-safe Redux state persistence for Redux Toolkit. A store enhancer that saves state to storage between sessions and rehydrates on startup — no reducer wrapping, no boilerplate.

> This repository is the development sandbox for persist-lite. The library lives in [`src/lib/persist-lite`](./src/lib/persist-lite). [`src/store-lite`](./src/store-lite) contains a reference Redux store wired up with the library.

## Contents

- [Redux Persist Lite sandbox](#redux-persist-lite-sandbox)
  - [Contents](#contents)
  - [Quick start](#quick-start)
    - [1. Define your root reducer first](#1-define-your-root-reducer-first)
    - [2. Wrap your app](#2-wrap-your-app)
  - [How it works](#how-it-works)
  - [persistLite options](#persistlite-options)
  - [Persistor API](#persistor-api)
  - [Storage engines](#storage-engines)
    - [Custom adapter](#custom-adapter)
  - [TTL \& versioning](#ttl--versioning)
    - [TTL](#ttl)
    - [Version-based invalidation](#version-based-invalidation)
  - [Whitelist \& blacklist](#whitelist--blacklist)
  - [Handling rehydration in slices](#handling-rehydration-in-slices)
  - [PersistGate](#persistgate)
    - [Blocking mode](#blocking-mode)
    - [Non-blocking mode (SSR-recommended)](#non-blocking-mode-ssr-recommended)
  - [usePersistor](#usepersistor)
  - [Plugins](#plugins)
    - [devLoggerPlugin](#devloggerplugin)
  - [Purge](#purge)
    - [Storage-only purge](#storage-only-purge)
    - [Redux-level purge (resets store state too)](#redux-level-purge-resets-store-state-too)
  - [vs redux-persist](#vs-redux-persist)

---

## Quick start

### 1. Define your root reducer first

Extract the root reducer before calling `configureStore` so you can derive `RootState` and pass it to `persistLite` without a circular reference.

```ts
// src/store-lite/index.ts
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { persistLite } from '../lib/persist-lite';
import { createPersistorEnhancer } from '../lib/persist-lite/enhancer';
import userReducer from './user.slice';
import cacheReducer from './cache.slice';

const rootReducer = combineReducers({
  user: userReducer,
  cache: cacheReducer,
});

// Derive RootState before the store exists — no circular dependency
export type RootState = ReturnType<typeof rootReducer>;

export const persistor = persistLite<RootState>({
  key: 'lite-root',
  whitelist: [{ key: 'user', whitelistKeys: ['me', 'count'] }],
  version: 1,
  ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
});

export function createAppStore() {
  return configureStore({
    reducer: rootReducer,
    enhancers: (getDefaultEnhancers) =>
      getDefaultEnhancers().concat(createPersistorEnhancer(persistor)),
  });
}

export type AppDispatch = ReturnType<typeof createAppStore>['dispatch'];
```

### 2. Wrap your app

```tsx
// src/main.tsx
import { Provider } from 'react-redux';
import { PersistGate } from '../lib/persist-lite/react';
import { persistor, createAppStore } from './store-lite';

const store = createAppStore();

createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <PersistGate persistor={persistor} loading={<Spinner />}>
      <App />
    </PersistGate>
  </Provider>
);
```

---

## How it works

persist-lite uses a **Redux store enhancer** rather than wrapping your reducers. Persistence is a side effect wired outside your state logic.

```ts
// createPersistorEnhancer does two things on store creation:

// 1. Subscribes to every state change → debounced flush to storage
store.subscribe(() => persistor.save(store.getState()));

// 2. Loads saved state → dispatches REHYDRATE → calls setLoaded()
persistor.load().then((saved) => {
  if (saved) store.dispatch(rehydrate(saved));
  persistor.setLoaded(); // unblocks PersistGate after REHYDRATE dispatches
});
```

> **Why `setLoaded()` is separate from `load()`:** calling `setLoaded()` inside `load()` would unblock `PersistGate` before `REHYDRATE` is dispatched, causing a flash of un-rehydrated UI. The enhancer calls it after dispatch.

---

## persistLite options

| Option | Type | Default | Description |
|---|---|---|---|
| `key` | `string` | — | **Required.** The storage key. |
| `storage` | `StorageEngine` | `createLocalStorage()` | Storage adapter. |
| `whitelist` | `SliceFilterInput[]` | — | Slices (or per-slice key lists) to persist. Everything else excluded. |
| `blacklist` | `SliceFilterInput[]` | — | Slices to exclude. All others persisted. |
| `debounceMs` | `number` | `300` | Write debounce in ms. Rapid changes coalesce into one flush. |
| `version` | `number` | `1` | Bump to invalidate all stored state on next load. |
| `ttl` | `number` | — | Milliseconds. State older than this is evicted on load. |
| `plugins` | `Plugin<TState>[]` | `[]` | Load/save lifecycle hooks. |

---

## Persistor API

The object returned by `persistLite()`.

| Method / Property | Description |
|---|---|
| `.load()` | Reads from storage. Checks version and TTL; returns `null` on mismatch or expiry. |
| `.save(state)` | Queues a debounced write. Called automatically by the enhancer. |
| `.flush()` | Immediately writes queued state. Writes are serialized, never concurrent. |
| `.purge(slices?)` | No argument: removes the storage key. With slice names: removes only those slices. |
| `.subscribe(fn)` | Status-change listener. Returns unsubscribe. Used by `useSyncExternalStore`. |
| `.status` | `'idle' \| 'loading' \| 'loaded' \| 'error'` |
| `.setLoaded()` | Called by the enhancer after dispatching `REHYDRATE`. Advances status to `'loaded'`. |

---

## Storage engines

Three built-in adapters ship with the library. All implement the async `StorageEngine` interface.

| Export | Description |
|---|---|
| `createLocalStorage()` | Wraps `window.localStorage`. Persists across sessions. **Default.** |
| `createSessionStorage()` | Wraps `window.sessionStorage`. Cleared when the tab closes. |
| `noopStorage` | Discards all reads and writes. Use during SSR to avoid `window` access. |

### Custom adapter

Any object matching `StorageEngine` works — AsyncStorage, IndexedDB, an API, anything.

```ts
import type { StorageEngine } from '../lib/persist-lite';

const myStorage: StorageEngine = {
  getItem: async (key) => /* ... */,
  setItem: async (key, value) => /* ... */,
  removeItem: async (key) => /* ... */,
};
```

---

## TTL & versioning

persist-lite wraps all stored state in an envelope:

```json
{
  "_v": 1,
  "_ts": 1753042800000,
  "_d": { "user": { "me": null, "count": 0 } }
}
```

- `_v` — version number, checked against the configured `version` option
- `_ts` — birth timestamp in milliseconds
- `_d` — your filtered Redux state

### TTL

On each `load()`, if `Date.now() - envelope._ts > ttl`, the storage key is removed and `null` is returned. The app rehydrates from `initialState`.

```ts
persistLite<RootState>({
  key: 'app',
  ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
});
```

> **`_ts` is a birth timestamp, not a last-modified timestamp.** It is set once when state is first written and preserved across all subsequent flushes. TTL therefore measures how long the data has existed in storage — not how long since the last user action. Without this, Redux's own `@@INIT` and `REHYDRATE` dispatches would reset the clock on every page load, making TTL impossible to trigger in practice.

### Version-based invalidation

Bump `version` when your state shape changes in a breaking way. Any stored envelope with a different `_v` is cleared.

```ts
persistLite<RootState>({
  key: 'app',
  version: 2, // was 1 — existing storage is discarded on next load
});
```

---

## Whitelist & blacklist

Control which parts of your Redux state are saved. `whitelist` takes precedence over `blacklist` when both match a slice.

```ts
// Persist only the user slice
{ whitelist: ['user'] }

// Persist only specific keys within the user slice
{ whitelist: [{ key: 'user', whitelistKeys: ['me', 'token'] }] }

// Persist everything except the cache slice
{ blacklist: ['cache'] }

// Persist everything except a specific key inside cache
{ blacklist: [{ key: 'cache', blacklistKeys: ['temp'] }] }
```

Filtering is applied in `flush()` before writing — only filtered state enters the envelope's `_d` field.

---

## Handling rehydration in slices

When the enhancer loads saved state, it dispatches a `@@PERSIST/REHYDRATE` action. Handle it in `extraReducers` to merge persisted values into your slice's `initialState`.

```ts
// user.slice.ts
import { createSlice } from '@reduxjs/toolkit';
import { rehydrate } from '../lib/persist-lite';

const userSlice = createSlice({
  name: 'user',
  initialState: { me: null, count: 0 },
  reducers: { /* ... */ },
  extraReducers: (builder) => {
    builder.addCase(rehydrate, (state, action) => {
      const saved = action.payload.user;
      if (saved) return { ...state, ...saved };
    });
  },
});
```

> Only spread the keys you trust from storage. The `{ ...state, ...saved }` pattern naturally falls back to `initialState` values for any keys not present in storage.

---

## PersistGate

Provides the persistor via React context and optionally blocks rendering until hydration completes.

| Prop | Type | Description |
|---|---|---|
| `persistor` | `Persistor` | **Required.** |
| `loading` | `ReactNode` | If provided: children block until `status === 'loaded'` or `'error'`. If omitted: non-blocking. |

### Blocking mode

Children don't render until rehydration completes. Use when your top-level layout depends on persisted data.

```tsx
<PersistGate persistor={persistor} loading={<Splash />}>
  <App />
</PersistGate>
```

### Non-blocking mode (SSR-recommended)

Children render immediately. Use `usePersistor()` inside components to handle the pre-hydration window. Preserves First Contentful Paint in Next.js and Remix.

```tsx
<PersistGate persistor={persistor}>
  <App />
</PersistGate>
```

---

## usePersistor

Subscribes to the persistor's status via `useSyncExternalStore`. Must be called inside a `<PersistGate>`.

```ts
import { usePersistor } from '../lib/persist-lite/react';

function UserAvatar() {
  const { isHydrated } = usePersistor();
  if (!isHydrated) return <AvatarSkeleton />;
  return <Avatar />;
}
```

**Returns:**

| Property | Type | Description |
|---|---|---|
| `persistor` | `Persistor` | The raw persistor — use to call `.purge()`, `.flush()`, etc. |
| `status` | `PersistorStatus` | `'idle' \| 'loading' \| 'loaded' \| 'error'` |
| `isHydrated` | `boolean` | `true` when `status === 'loaded'`. |

---

## Plugins

Plugins intercept the load and save lifecycle. Each hook receives state and must return it (modified or unchanged).

```ts
interface Plugin<TState> {
  onLoad?:    (state: TState) => TState | Promise<TState>;  // runs first on load
  afterLoad?: (state: TState) => TState | Promise<TState>;  // runs after all onLoad hooks
  onSave?:    (state: TState) => TState | Promise<TState>;  // runs before writing to storage
}
```

### devLoggerPlugin

Logs hydration timing and save activity. Enabled in development, silent in production.

```ts
import { devLoggerPlugin } from '../lib/persist-lite/plugins/devLogger';

persistLite<RootState>({
  key: 'app',
  plugins: [devLoggerPlugin()],
});
```

Pass `false` to force-disable: `devLoggerPlugin(false)`.

---

## Purge

Two ways to clear persisted state: via the persistor (storage only), or via a Redux action (storage + Redux state).

### Storage-only purge

```ts
// Clear everything
await persistor.purge();

// Clear specific slices only
await persistor.purge(['cache', 'ui']);
```

### Redux-level purge (resets store state too)

Dispatch `persistPurge` and handle it in each slice's `extraReducers`.

```ts
import { persistPurge } from '../lib/persist-lite';

// Dispatch from anywhere (e.g. logout handler)
dispatch(persistPurge());

// Handle in each slice that should reset
extraReducers: (builder) => {
  builder.addCase(persistPurge, () => initialState);
}
```

> Purge cancels any in-flight debounced save. An `_isPurging` flag prevents a concurrent `flush()` from writing stale state back after the storage key has been removed.

---

## vs redux-persist

|  | persist-lite | redux-persist |
|---|---|---|
| Store wiring | Store enhancer — reducers unchanged | `persistReducer` wraps each reducer |
| TypeScript | Full `TState` inference through store | Partial — manual type casting common |
| SSR | Non-blocking gate built-in, `noopStorage` | Requires manual configuration |
| TTL | ✓ built-in, fixed-window | ✗ |
| Version invalidation | ✓ `version` option | ✓ with `migrate` |
| Plugin API | ✓ `onLoad` / `onSave` / `afterLoad` | ✓ transforms |
| RTK compatibility | Designed for RTK | Works, designed pre-RTK |
