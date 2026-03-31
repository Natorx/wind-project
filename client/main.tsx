import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ActiveItemProvider } from "./context/activeItemContext";
import 'virtual:uno.css'

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ActiveItemProvider>
      <App />
    </ActiveItemProvider>
  </React.StrictMode>,
);
