import { useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Provider, useDispatch, useSelector } from 'react-redux';
import type { RootState } from './store-classic';
import { store, persistor as persistorStore } from './store-classic';
import { fetchUser, updateCount } from './store-classic/user';
import { setCache } from './store-classic/cache';
import { PersistGate, usePersistor } from './lib/persist-lite/react';

function ClassicStore({ change }: { change: () => void }) {
  return (
    <Provider store={store}>
      <PersistGate persistor={persistorStore} loading={<div>Redux Persist Loading...</div>}>
        <Classic change={change} />
      </PersistGate>
    </Provider>
  );
}

function Classic({ change }: { change: () => void }) {
  const dispatch = useDispatch();
  const count = useSelector((state: RootState) => state.user.count);

  const { persistor } = usePersistor();

  useEffect(() => {
    dispatch(fetchUser());
  }, []);

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h3>Redux Persist Lite</h3>
      <h1>Vite + React + Classic</h1>
      <div className="card">
        <button onClick={() => dispatch(updateCount())}>
          count is {count}
        </button>
        <p>
          Edit <code>src/Classic.tsx</code> and save to test HMR
        </p>
        <button onClick={() => dispatch(setCache([{ id: Math.random().toString(), value: 'Cached Data' }]))}>
          CACHE DATA
        </button>
        <br />
        <br />
        <button onClick={async () => await persistor.flush()}>
          FLUSH DATA
        </button>
        <br />
        <br />
        <button onClick={async () => await persistor.purge(['user'])}>
          RESET DATA
        </button>
        <br />
        <br />
        <button onClick={change}>
          SWITCH TO RTK
        </button>
      </div>
    </>
  )
}

export default ClassicStore;
