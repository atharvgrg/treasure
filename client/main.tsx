import { createRoot } from "react-dom/client";
import App from "./App";

const rootElement = document.getElementById("root")!;

// Create root only once
const root = createRoot(rootElement);
root.render(<App />);
