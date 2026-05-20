import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { applyCachedTheme } from "./components/ThemeProvider";
import "./styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("#root not found");

applyCachedTheme();

// Register service worker for offline support
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js").catch((err) => {
      console.warn("[Percy's Library] Service worker registration failed:", err);
    });
  });
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
