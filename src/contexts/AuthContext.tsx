import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import api from '../api/api';
import type { User, AuthResponse } from '../types';

/**
 * Interfaz extendida para soportar ambos métodos de autenticación.
 */
interface AuthContextType {
  user: User | null;
  loginWithGoogle: () => void; // Camino "Ninja" vía Auth0.
  login: (email: string, pass: string) => Promise<void>; // Camino "Tradicional" directo al backend.
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { 
    loginWithRedirect, 
    logout: logoutAuth0, 
    getAccessTokenSilently, 
    isAuthenticated, 
    isLoading: isAuth0Loading 
  } = useAuth0();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * PERSISTENCIA LOCAL: Rehidratar sesión al cargar la página.
   */
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('authToken');
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
    // No quitamos el loading aquí si Auth0 está cargando, para evitar parpadeos.
  }, []);

  /**
   * SINCRONIZACIÓN GOOGLE: Solo se dispara si Auth0 detecta sesión.
   */
  useEffect(() => {
    const syncWithBackend = async () => {
      if (isAuthenticated) {
        try {
          const token = await getAccessTokenSilently();
          const response = await api.post<AuthResponse>('/auth/google', { 
            Auth0Token: token,
            SitioId: 1 
          });

          const { jwt, usuario } = response.data;
          localStorage.setItem('authToken', jwt);
          localStorage.setItem('user', JSON.stringify(usuario));
          setUser(usuario);
        } catch (error) {
          console.error("Error sincronizando Google con el backend:", error);
        }
      }
      setLoading(false);
    };

    if (!isAuth0Loading) {
      syncWithBackend();
    }
  }, [isAuthenticated, isAuth0Loading, getAccessTokenSilently]);

  /**
   * MÉTODO NINJA: Salta directo a Google.
   */
  const loginWithGoogle = () => {
    console.log("Redirigiendo directamente a Google...");
    loginWithRedirect({
      authorizationParams: {
        connection: 'google-oauth2' 
      }
    });
  };

  /**
   * MÉTODO TRADICIONAL: Login directo con tu Backend .NET.
   */
  const login = async (email: string, password: string) => {
    try {
      const response = await api.post<AuthResponse>('/auth/login', { email, password });
      const { jwt, usuario } = response.data;

      localStorage.setItem('authToken', jwt);
      localStorage.setItem('user', JSON.stringify(usuario));
      setUser(usuario);
    } catch (error) {
      console.error("Error en login tradicional:", error);
      throw error;
    }
  };

  /**
   * LOGOUT HÍBRIDO: Limpia local y también avisa a Auth0 por si acaso.
   */
  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
    
    // Si el usuario estaba con Auth0, cerramos sesión allá también.
    if (isAuthenticated) {
      logoutAuth0({ logoutParams: { returnTo: window.location.origin } });
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loginWithGoogle, 
      login, 
      logout, 
      loading: loading || isAuth0Loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
