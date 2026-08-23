import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { Provider } from "react-redux";
// import { persister, createAppStore } from "./lib/store";
import { persistor, createAppStore } from "./store-lite";
import { PersistGate } from "./lib/persist-lite/react/PersistGate.tsx";

async function bootstrap() {
  console.log({ persistor})
  const store = createAppStore();

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <Provider store={store}>
        <PersistGate persistor={persistor} loading={<div>Redux Persist Loading...</div>}>
          <App />
        </PersistGate>
      </Provider>
    </StrictMode>,
  );
}

bootstrap();
