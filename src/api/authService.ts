import api from './api';
import type { AuthResponse, LoginCredentials, RegisterCredentials, Sitio } from '../types/index';

/**
 * Servicio encargado de las peticiones HTTP relacionadas con la autenticación.
 * Centraliza las llamadas a la API para mantener el AuthContext limpio.
 */
export const authService = {
  /**
   * Realiza el inicio de sesión tradicional con email y contraseña.
   */
  login: async (credentials: LoginCredentials & { slug?: string }) => {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  /**
   * Registra un nuevo usuario en el sistema.
   */
  register: async (credentials: RegisterCredentials & { slug?: string }) => {
    const response = await api.post<AuthResponse>('/auth/register', credentials);
    return response.data;
  },

  /**
   * Sincroniza el usuario autenticado vía Auth0/Google con el backend local.
   */
  syncGoogleUser: async (token: string, slug?: string) => {
    const response = await api.post<AuthResponse>('/auth/google', {
      Auth0Token: token,
      SitioId: 0, // Fallback dummy, el backend priorizará el slug
      Slug: slug
    });
    return response.data;
  },

  /**
   * Verifica si un slug de sitio es válido y está activo en el sistema.
   */
  validarSlug: async (slug: string) => {
    const response = await api.get<Sitio>(`/sitios/validar/${slug}`);
    return response.data;
  },

  /**
   * Valida si un código de invitación es correcto para el sitio dado
   */
  validarInvitacion: async (token: string, slug: string) => {
    try {
      const response = await api.get<{ valido: boolean }>(`/invitacion/validar?token=${token}&slug=${slug}`);
      return response.data.valido;
    } catch {
      return false; // Ante cualquier error, asumimos inválido para máxima seguridad
    }
  }
};
