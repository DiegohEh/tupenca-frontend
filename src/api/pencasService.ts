import api from './api';

export interface PencaAPI {
  id: number;
  pencaId: number;
  nombre: string;
  deporte: string;
  costo: number;
  yaParticipa: boolean;
  idParticipacion: number;

}

export const pencasService = {
  /**
   * Obtiene la lista de pencas disponibles para un sitio.
   */
  getPencasDelSitio: async (slug: string): Promise<PencaAPI[]> => {
    const response = await api.get(`/pencas/${slug}`);
    return response.data;
  }, 
  
  /**
   * Obtiene la lista de pencas cargadas en el sistema para asociar al sitio.
   */
  getPencas: async () => {
    const response = await api.get(`/pencas`);
    return response.data;
  },  
  
  asociarPenca: async (costo: number, pencaId: number) => {
    const response = await api.post(`/sitios/asociarpenca?costo=${costo}&pencaId=${pencaId}`);
    return response.data;
 }

};
