import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
// import { Provider } from "react-redux";
// import { persistor, createAppStore } from "./store-lite";
// import { PersistGate } from "./lib/persist-lite/react/PersistGate.tsx";
// import { persistor, store } from "./store-classic";
import App from "./App.tsx";

async function bootstrap() {
  // const store = createAppStore();

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

bootstrap();
