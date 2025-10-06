import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n/config";

console.log('main.tsx loading');

try {
  const root = document.getElementById("root");
  console.log('Root element found:', !!root);
  
  if (root) {
    createRoot(root).render(<App />);
    console.log('App rendered');
  } else {
    console.error('Root element not found!');
  }
} catch (error) {
  console.error('Error rendering app:', error);
}
