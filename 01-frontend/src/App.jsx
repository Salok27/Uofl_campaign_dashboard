import React from "react";
import Dashboard from "./Dashboard.jsx";

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <span className="header-label">ANALYTICS</span>
          <h1 className="header-title">Campaign Dashboard</h1>
        </div>
      </header>
      <main>
        <Dashboard />
      </main>
    </div>
  );
}

export default App;