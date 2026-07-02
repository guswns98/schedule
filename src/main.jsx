import React from "react";
import ReactDOM from "react-dom/client";
import { StoreProvider } from "./store/StoreContext";
import AuthGate from "./components/layout/AuthGate";
import App from "./App";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthGate>
      <StoreProvider>
        <App />
      </StoreProvider>
    </AuthGate>
  </React.StrictMode>
);
