import { useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { useAppDispatch, useAppSelector } from './lib/store/hooks';
import { fetchUser, updateCount } from './lib/store/user.slice';
import { setCache } from './lib/store/cache.slice';

function App() {
  const dispatch = useAppDispatch();
  const count = useAppSelector((state) => state.user.count);

  useEffect(() => {
    dispatch(fetchUser('id'));
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
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => dispatch(updateCount())}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
        <button onClick={() => dispatch(setCache([{ id: Math.random().toString(), value: 'Cached Data' }]))}>
          CACHE DATA
        </button>
      </div>
    </>
  )
}

export default App
