import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Auth0Provider } from '@auth0/auth0-react'
import { AuthProvider } from './contexts/AuthContext' // Se impota el contexto
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Auth0Provider
      domain="diegoheh.us.auth0.com"
      clientId="9VhEw6fgeYY6Vu18u1NUeZTsP1ipxtU6"
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: "https://tupenca-api"
      }}
    >
      <AuthProvider>
        <App />
      </AuthProvider>
    </Auth0Provider>
  </StrictMode>,
)
