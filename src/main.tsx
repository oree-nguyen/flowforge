import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Security Domain Lock: Redirect unauthorized domain mirrors back to official site
if (import.meta.env.PROD) {
  const ALLOWED_HOSTS = ['oree-nguyen.github.io', 'localhost', '127.0.0.1'];
  if (!ALLOWED_HOSTS.includes(window.location.hostname)) {
    window.location.href = 'https://oree-nguyen.github.io/flowforge';
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
