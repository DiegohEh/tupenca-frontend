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
    const response = await api.post<AuthResponse>('/api/auth/login', credentials);
    return response.data;
  },

  /**
   * Registra un nuevo usuario en el sistema.
   */
  register: async (credentials: RegisterCredentials & { slug?: string }) => {
    const response = await api.post<AuthResponse>('/api/auth/register', credentials);
    return response.data;
  },

  /**
   * Sincroniza el usuario autenticado vía Auth0/Google con el backend local.
   */
/*<<<<<<< HEAD
  syncGoogleUser: async (token: string, sitioId: number = 1, slug?: string) => {
    const response = await api.post<AuthResponse>('/api/auth/google', {
=======*/
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
    const response = await api.get<Sitio>(`/api/sitios/validar/${slug}`);
    return response.data;
  },

  /**
   * Obtiene todas las pencas de un sitio.
   */
  getPencas: async () => {
    const response = await api.get(`/api/pencas`);
    return response.data;
  },

  /**
   * Obtiene todos los partidos de una penca y las predicciones del usuario.
   */
  getPartidosPenca: async (idParticipacion: number = 1, idPenca: number = 1) => {
    const response = await api.get(`/api/predicciones/partidos?idParticipacion=${idParticipacion}&idPenca=${idPenca}`);
    return response.data;
  },
  
  /**
   * Envía los datos de una predicción realizada por el usuario.
   */
  realizarPrediccion: async (idPrediccion : number = 1, golesLocal: number = 1, 
    golesVisitante: number = 1, idParticipacion: number = 1, idPartido: number = 1,  idSitio: number = 1) => {
    
    const response = await api.post(`/api/predicciones/create`, {
            id : Number(idPrediccion),
            golesEquipoLocal: Number(golesLocal),
            golesEquipoVisitante: Number(golesVisitante),
            participacionId: Number(idParticipacion),
            partidoId: Number(idPartido),
            sitioId: Number(idSitio) 
      });
    
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
  },

  getPencasSistema: async () => {
  const response = await api.get('/api/pencas/sistema');
  return response.data;
  },

  asociarPenca: async (costo: number, pencaId: number) => {
    const response = await api.post(`/api/sitios/asociarpenca?costo=${costo}&pencaId=${pencaId}`);
    return response.data;
  }
};
