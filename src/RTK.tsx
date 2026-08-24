import { useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { useAppDispatch, useAppSelector } from './store-lite/hooks';
import { fetchUser, updateCount } from './store-lite/user.slice';
import { setCache } from './store-lite/cache.slice';
import { PersistGate, usePersistor } from './lib/persist-lite/react';
import { Provider } from 'react-redux';
import { createAppStore, persistor as persistorStore } from './store-lite';

function RTKStore({ change }: { change: () => void }) {
  const store = createAppStore();

  return (
    <Provider store={store}>
      <PersistGate persistor={persistorStore} loading={<div>Redux Persist Loading...</div>}>
        <RTK change={change} />
      </PersistGate>
    </Provider>
  );
}

function RTK({ change }: { change: () => void }) {
  const dispatch = useAppDispatch();
  const count = useAppSelector((state) => state.user.count);
  
  const { persistor, 
    // isHydrated, status
   } = usePersistor();

  useEffect(() => {
    dispatch(fetchUser('id'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <h1>Vite + React + RTK</h1>
      <div className="card">
        <button onClick={() => dispatch(updateCount())}>
          count is {count}
        </button>
        <p>
          Edit <code>src/RTK.tsx</code> and save to test HMR
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
          SWITCH TO CLASSIC
        </button>
      </div>
    </>
  )
}

export default RTKStore;
