import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { Provider } from "react-redux";
import { persister, createAppStore } from "./lib/store";

async function bootstrap() {
  const preloadedState = await persister.load();
  const store = createAppStore(preloadedState ?? undefined);

  let lastState = store.getState();

  store.subscribe(() => {
    const state = store.getState();
    if (state !== lastState) {
      lastState = state;
      persister.save(state);
    }
  });

  console.log("App is bootstrapped with preloaded state:", preloadedState);

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </StrictMode>,
  );
}

bootstrap();
