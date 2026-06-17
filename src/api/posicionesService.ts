import api from './api';

export interface Posicion {
    posicion: number;
    usuarioNombre: string;
    puntos: number;
    esUsuarioActual: boolean;
}

export const posicionesService = {
    // Le pasamos el slug (del tenant) y el ID de la penca instancia
    obtenerLeaderboard: async (slug: string, pencaInstanciaId: number): Promise<Posicion[]> => {
        const response = await api.get(`/pencas-sitio/${slug}/posiciones/${pencaInstanciaId}`);
        return response.data;
    }
};
