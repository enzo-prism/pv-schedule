import { createRoot } from "react-dom/client";
import "@fontsource-variable/inter/wght.css";
import App from "./App";
import "./index.css";

document.documentElement.classList.add("dark");

createRoot(document.getElementById("root")!).render(<App />);
