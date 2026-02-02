/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Stuma - Teacher Attendance Tracking System
 * Application Entry Point
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

console.log("[INIT] Starting Stuma application");
console.log("[INIT] Environment:", import.meta.env.MODE);
console.log(
  "[INIT] API URL:",
  import.meta.env.VITE_API_URL || "http://localhost:5000",
);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
