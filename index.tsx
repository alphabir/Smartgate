
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
      <div style="padding: 40px; color: white; background: #020617; font-family: sans-serif; height: 100vh; display: flex; align-items: center; justify-content: center; text-align: center;">
        <div>
          <h1 style="font-weight: 900; font-size: 2rem; margin-bottom: 1rem;">Boot Sequence Failure</h1>
          <p style="color: #94a3b8; max-width: 500px; margin: 0 auto 2rem;">The College Advisor system failed to initialize. This is likely due to a biometric registry or configuration error.</p>
          <pre style="background: #1e293b; padding: 20px; border-radius: 12px; color: #ef4444; font-size: 0.8rem; overflow: auto; text-align: left; max-width: 80vw;">${error instanceof Error ? error.stack : String(error)}</pre>
          <button onclick="location.reload()" style="margin-top: 2rem; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 12px; border: none; font-weight: 900; cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">Retry System Boot</button>
        </div>
      </div>
    `;
  }
}
