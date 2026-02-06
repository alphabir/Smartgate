
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("Institutional Failure: Root container 'root' not found in DOM.");
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error("Critical Boot Error:", error);
    rootElement.innerHTML = `
      <div style="padding: 40px; color: #ef4444; font-family: sans-serif; text-align: center;">
        <h1 style="font-weight: 900;">Advisor System Boot Failure</h1>
        <p>A biometric initialization error occurred. Please check the institutional logs.</p>
        <pre style="text-align: left; background: #f1f5f9; padding: 20px; border-radius: 8px; font-size: 12px; color: #334155;">${error instanceof Error ? error.message : String(error)}</pre>
      </div>
    `;
  }
}
