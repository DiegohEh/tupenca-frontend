import api from './api';

export interface PencaAPI {
  id: number;
  pencaId: number;
  nombre: string;
  deporte: string;
  costo: number;
  yaParticipa: boolean;
  idParticipacion?: number;
}

export const pencasService = {
  /**
   * Obtiene la lista de pencas disponibles para un sitio.
   */
  getPencasDelSitio: async (slug: string): Promise<PencaAPI[]> => {
    const response = await api.get(`/pencas/${slug}`);
    return response.data;
  }
};
