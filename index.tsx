
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
    console.error("Critical Render Error:", error);
    rootElement.innerHTML = `
      <div style="padding: 40px; color: white; background: #020617; font-family: sans-serif; height: 100vh;">
        <h1 style="font-weight: 900;">Initialization Error</h1>
        <p>The College Advisor system failed to boot. Check console for biometric registry errors.</p>
        <pre style="background: #1e293b; padding: 20px; border-radius: 12px; color: #94a3b8;">${error instanceof Error ? error.message : String(error)}</pre>
      </div>
    `;
  }
}
