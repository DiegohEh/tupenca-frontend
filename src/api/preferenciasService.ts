import api from './api';
import type { PreferenciasNotificacionDTO } from '../types/index';

export const preferenciasService = {
  /**
   * Obtiene las preferencias de notificación del usuario para el sitio actual.
   */
  getPreferencias: async (slug: string): Promise<PreferenciasNotificacionDTO> => {
    const response = await api.get(`/preferencias/${slug}/notificaciones`);
    return response.data;
  },

  /**
   * Actualiza las preferencias de notificación del usuario.
   */
  updatePreferencias: async (slug: string, preferencias: PreferenciasNotificacionDTO) => {
    const response = await api.put(`/preferencias/${slug}/notificaciones`, preferencias);
    return response.data;
  }
};
