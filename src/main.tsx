import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Auth0Provider } from '@auth0/auth0-react'
import { AuthProvider } from './contexts/AuthContext'
import { SiteProvider } from './contexts/SiteContext'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Auth0Provider
      domain="dev-tohysoy6fqmar1v7.us.auth0.com"
      clientId="5Kv0vRTwoYKaKFoJYDhDEvnj1DFHAFi4"
      authorizationParams={{
        redirect_uri: window.location.origin,
      }}
    >
      <SiteProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </SiteProvider>
    </Auth0Provider>
  </StrictMode>,
)
