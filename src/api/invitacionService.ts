import api from './api';

/**
 * Servicio encargado de las peticiones relacionadas con las invitaciones.
 */
export const invitacionService = {
  /**
   * Genera un nuevo token de invitación para un sitio.
   */
  generar: async (slug: string, email?: string) => {
    const response = await api.post('/invitacion/generar', {
      slug,
      email
    });
    return response.data;
  }
};
