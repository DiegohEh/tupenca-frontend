import api from './api';

export interface PartidoAPI {
    id: number;
    local: { nombre: string; logoUrl: string };
    visitante: { nombre: string; logoUrl: string };
    fecha: string;
    golesLocal: number | null;
    golesVisitante: number | null;
    jugado: boolean;
    prediccion: {
        id: number;
        golesEquipoLocal: number;
        golesEquipoVisitante: number;
        puntosObtenidos: number;
    } | null;
}

export const partidosService = {
    /**
     * Obtiene los partidos y predicciones de una participación de penca.
     */
    getPartidos: async (slug: string, pencaInstanciaId: number): Promise<PartidoAPI[]> => {
        const response = await api.get(`/pencas/${slug}/${pencaInstanciaId}/partidos`);
        return response.data;
    }
};
