import { createRoot } from "react-dom/client";
import { setBaseUrl } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

// In production setBaseUrl points to the deployed API.
// In dev the Vite proxy forwards /api to localhost:5000,
// so we leave the base URL unset (relative paths work via proxy).
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
if (import.meta.env.PROD && typeof apiBaseUrl === "string" && apiBaseUrl.length > 0) {
  setBaseUrl(apiBaseUrl);
}

createRoot(document.getElementById("root")!).render(<App />);
