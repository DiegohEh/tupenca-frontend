import api from './api';

/**
 * Servicio encargado de las peticiones relacionadas con el perfil del usuario.
 */
export const userService = {
  /**
   * Actualiza la contraseña del usuario logueado.
   * Envía la contraseña vieja (si existe) y la nueva al backend.
   */
  updatePassword: async (slug : string, oldPassword: string | null, newPassword: string) => {
    // La petición viaja con el token JWT automáticamente gracias al interceptor de axios
    const response = await api.post('/user/update-password', {
      oldPassword,
      newPassword,
      slug
    });
    return response.data;
  }
};
