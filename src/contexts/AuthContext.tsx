import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { authService } from '../api/authService';
import type { User, AuthResponse, LoginCredentials, RegisterCredentials } from '../types/index';

interface AuthContextType {
    user: User | null;
    loginWithGoogle: (slug?: string) => void;
    login: (credentials: LoginCredentials, slug?: string) => Promise<void>;
    register: (credentials: RegisterCredentials, slug?: string) => Promise<void>;
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

    /**
     * Helper para persistir la sesión localmente.
     */
    const handleAuthSuccess = useCallback((authData: AuthResponse) => {
        localStorage.setItem('authToken', authData.jwt);
        localStorage.setItem('user', JSON.stringify(authData.usuario));
        setUser(authData.usuario);
    }, []);

    /**
     * Helper para limpiar la sesión local.
     */
    const clearLocalAuth = useCallback(() => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setUser(null);
    }, []);

    // Rehidratar sesión al cargar
    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        const token = localStorage.getItem('authToken');
        if (savedUser && token) {
            setUser(JSON.parse(savedUser));
        }
    }, []);

    // Sincronización con Auth0/Google
    useEffect(() => {
        const sync = async () => {
            if (isAuthenticated) {
                try {
                    const token = await getAccessTokenSilently();

                    // Se intenta extraer el slug de la URL (asumiendo formato /:slug/...)
                    const pathParts = window.location.pathname.split('/');
                    const slug =
                        pathParts[1] !== 'login' && pathParts[1] !== 'register' && pathParts[1] !== ''
                            ? pathParts[1]
                            : undefined;

                    const authData = await authService.syncGoogleUser(token, 1, slug);
                    handleAuthSuccess(authData);
                } catch (error) {
                    console.error('Error sincronizando con Google:', error);
                }
            }
            setLoading(false);
        };

        if (!isAuth0Loading) {
            sync();
        }
    }, [isAuthenticated, isAuth0Loading, getAccessTokenSilently, handleAuthSuccess]);

    const loginWithGoogle = (slug?: string) => {
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
            handleAuthSuccess(authData);
        } catch (error) {
            console.error('Error en login:', error);
            throw error;
        }
    };

    const register = async (credentials: RegisterCredentials, slug?: string) => {
        try {
            const authData = await authService.register({ ...credentials, slug });
            handleAuthSuccess(authData);
        } catch (error) {
            console.error('Error en registro:', error);
            throw error;
        }
    };

    const logout = () => {
        // Capturamos el slug antes de limpiar para persistirlo
        const pathParts = window.location.pathname.split('/');
        const currentSlug =
            pathParts[1] !== 'login' && pathParts[1] !== 'register' && pathParts[1] !== '' ? pathParts[1] : null;
        console.log('currentSlug', currentSlug);
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
            // Se actualiza en localStorage para persistir en caso de recarga.
            localStorage.setItem('user', JSON.stringify(newUser));
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
