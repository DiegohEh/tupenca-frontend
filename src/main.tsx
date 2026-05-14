import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Auth0Provider } from '@auth0/auth0-react'
import type { AppState } from '@auth0/auth0-react'
import { BrowserRouter, useNavigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { SiteProvider } from './contexts/SiteContext'
import './index.css'
import App from './App.tsx'

/**
 * Componente envoltorio para Auth0Provider que permite usar el hook useNavigate.
 * Esto es necesario para que Auth0 pueda redirigir correctamente dentro del
 * contexto de React Router después de la autenticación.
 */
const Auth0ProviderWithNavigate = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();

  const onRedirectCallback = (appState?: AppState) => {
    // Redirige a la ruta guardada en appState o a la raíz actual
    navigate(appState?.returnTo || window.location.pathname);
  };

  return (
    <Auth0Provider
      domain="dev-tohysoy6fqmar1v7.us.auth0.com"
      clientId="5Kv0vRTwoYKaKFoJYDhDEvnj1DFHAFi4"
      authorizationParams={{
        redirect_uri: window.location.origin,
      }}
      onRedirectCallback={onRedirectCallback}
    >
      {children}
    </Auth0Provider>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Auth0ProviderWithNavigate>
        <SiteProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </SiteProvider>
      </Auth0ProviderWithNavigate>
    </BrowserRouter>
  </StrictMode>,
)
