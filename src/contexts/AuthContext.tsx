import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { authService } from '../api/authService';
import type { User, AuthResponse, LoginCredentials, RegisterCredentials } from '../types/index';

interface AuthContextType {
    user: User | null;
    loginWithGoogle: (slug?: string) => void;
    login: (credentials: LoginCredentials, slug?: string) => Promise<void>;
    register: (credentials: RegisterCredentials, slug?: string) => Promise<any>;
    logout: () => void;
    updateLocalUser: (updatedUser: Partial<User>) => void;
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
    const location = useLocation();

    // Calcula el slug actual basándose en la URL
    const pathParts = location.pathname.split('/');
    const currentSlug = pathParts[1] !== 'login' && pathParts[1] !== 'register' && pathParts[1] !== '' ? pathParts[1] : null;

    /**
     * Helper para persistir la sesión localmente.
     */
    const handleAuthSuccess = useCallback((authData: AuthResponse, explicitSlug?: string | null) => {
        const targetSlug = explicitSlug !== undefined ? explicitSlug : currentSlug;
        const keySlug = targetSlug ? `_${targetSlug}` : '';
        localStorage.setItem(`authToken${keySlug}`, authData.jwt);
        localStorage.setItem(`user${keySlug}`, JSON.stringify(authData.usuario));
        setUser(authData.usuario);
    }, [currentSlug]);

    /**
     * Helper para limpiar la sesión local para el slug actual.
     */
    const clearLocalAuth = useCallback(() => {
        const keySlug = currentSlug ? `_${currentSlug}` : '';
        localStorage.removeItem(`authToken${keySlug}`);
        localStorage.removeItem(`user${keySlug}`);
        setUser(null);
    }, [currentSlug]);

    // Rehidratar o limpiar sesión al cambiar de slug (Navegación)
    useEffect(() => {
        const keySlug = currentSlug ? `_${currentSlug}` : '';
        const savedUser = localStorage.getItem(`user${keySlug}`);
        const token = localStorage.getItem(`authToken${keySlug}`);
        
        if (savedUser && token) {
            setUser(JSON.parse(savedUser));
        } else {
            // Si navegamos a un slug donde no tenemos sesión, nos deslogueamos visualmente
            setUser(null);
        }
    }, [currentSlug]);

    const syncAttempted = useRef(false);

    // Sincronización con Auth0/Google
    // Para cuando se retorna desde auth0, detectar si el login fue exitoso para sincronizar con backend.
    useEffect(() => {
        const sync = async () => {
            if (isAuthenticated) {
                if(syncAttempted.current) return;
                syncAttempted.current = true;
                
                // Se intenta extraer el slug de la URL
                const pathParts = window.location.pathname.split('/');
                const currentSlug =
                    pathParts[1] !== 'login' && pathParts[1] !== 'register' && pathParts[1] !== ''
                        ? pathParts[1]
                        : undefined;

                try {
                    const token = await getAccessTokenSilently();
                    const authData = await authService.syncGoogleUser(token, currentSlug);
                    handleAuthSuccess(authData, currentSlug);
                } catch (error: any) {
                    console.error('Error sincronizando con Google:', error);
                    const errorMsg = error.response?.data?.mensaje || 'Error al sincronizar tu cuenta de Google.';
                    sessionStorage.setItem('google_auth_error', errorMsg);
                    
                    if (currentSlug) {
                        localStorage.setItem('lastSlug', currentSlug);
                    }
                    
                    logoutAuth0({
                        logoutParams: {
                            returnTo: window.location.origin
                        }
                    });
                }
            }
            setLoading(false);
        };

        if (!isAuth0Loading) {
            sync();
        }
    }, [isAuthenticated, isAuth0Loading, getAccessTokenSilently, handleAuthSuccess]);

    const loginWithGoogle = (slug?: string) => {
        // Función de librería auth0, guarda a dónde tiene que devolver y recarga la página entera hacia auth0.
        loginWithRedirect({
            appState: {
                returnTo: slug ? `/${slug}` : window.location.pathname
            },
            authorizationParams: { connection: 'google-oauth2' }
        });
    };

    const login = async (credentials: LoginCredentials, slug?: string) => {
        try {
            const authData = await authService.login({ ...credentials, slug });
            handleAuthSuccess(authData, slug);
        } catch (error) {
            console.error('Error en login:', error);
            throw error;
        }
    };

    const register = async (credentials: RegisterCredentials, slug?: string) => {
        try {
            const authData = await authService.register({ ...credentials, slug });
            
            // Check if backend returned 202 Accepted (pending approval)
            if ((authData as any).status === 'pending') {
                return authData;
            }
            
            handleAuthSuccess(authData, slug);
        } catch (error) {
            console.error('Error en registro:', error);
            throw error;
        }
    };

    const logout = () => {
        if (currentSlug) {
            localStorage.setItem('lastSlug', currentSlug);
        }

        clearLocalAuth();

        // Auth0 requiere que returnTo esté registrada en su panel.
        // Generalmente solo registramos el origin (ej: http://localhost:5173), no podemos tampoco registrar cada slug porque pueden ser infinitos.
        // Si intentamos mandar a /slug/login y no está registrada, tira el error Auth0.
        // Entonces se manda a la raíz y se gestiona la redirección al sitio nuevamente fuera de esto.
        if (isAuthenticated) {
            logoutAuth0({
                logoutParams: {
                    returnTo: window.location.origin
                }
            });
        }
    };

    // Helper para actualizar datos del usuario localmente
    const updateLocalUser = (updatedUser: Partial<User>) => {
        setUser((prevUser) => {
            if(!prevUser) return null;

            const newUser = {...prevUser, ...updatedUser};
            const keySlug = currentSlug ? `_${currentSlug}` : '';
            // Se actualiza en localStorage para persistir en caso de recarga.
            localStorage.setItem(`user${keySlug}`, JSON.stringify(newUser));
            return newUser;
        });
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loginWithGoogle,
                login,
                register,
                logout,
                updateLocalUser,
                loading: loading || isAuth0Loading
            }}
        >
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
