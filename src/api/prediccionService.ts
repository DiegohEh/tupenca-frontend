import api from './api';

/**
 * Servicio encargado de las peticiones HTTP relacionadas con las predicciones.
 * Centraliza las llamadas a la API para mantener el AuthContext limpio.
 */
export const prediccionService = {
 realizarPrediccion: async (idPrediccion : number = 1, golesLocal: number = 1, 
    golesVisitante: number = 1, idParticipacion: number = 1, idPartido: number = 1) => {
    
    const response = await api.post(`/predicciones/create`, {
            id : Number(idPrediccion),
            golesEquipoLocal: Number(golesLocal),
            golesEquipoVisitante: Number(golesVisitante),
            participacionId: Number(idParticipacion),
            partidoId: Number(idPartido)
      });
    
    return response.data;
  },

    /**
   * Obtiene todos los partidos de una penca y las predicciones del usuario.
   */
  getPartidosPenca: async (idParticipacion: number = 1) => {
    const response = await api.get(`/predicciones/partidos?idParticipacion=${idParticipacion}`);
    return response.data;
  },


  resultadosPredicciones: async(partidoId : number) => {
    const response = await api.get(`predicciones/resultados?partidoId=${partidoId}`);
    return response.data;
  },

  tendenciaPredicciones: async(partidoId : number) => {
    const response = await api.get(`predicciones/tendencia?partidoId=${partidoId}`);
    return response.data;
  },

  getIdParticipacion: async(pencaInstanciaId : number) => {
    const response = await api.get(`predicciones/participaciones/mia?pencaInstanciaId=${pencaInstanciaId}`);
    return response.data;
  }
};