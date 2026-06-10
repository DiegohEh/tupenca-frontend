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
  },
  
  /**
   * Actualiza los datos generales del perfil (Nombre, Avatar)
   */
  updateProfile: async (slug: string, nombre: string, avatarUrl: string | null) => {
    const response = await api.put('/user/profile', {
      nombre,
      avatarUrl,
      slug
    });
    return response.data;
  },

  /**
   * Sube una nueva imagen de perfil al backend, el cual se encarga de subirla a Cloudinary.
   */
  uploadAvatar: async (slug: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('slug', slug);

    const response = await api.post('/user/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
};
