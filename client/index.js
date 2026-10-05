import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./src/App";
function Root() {
  return (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
