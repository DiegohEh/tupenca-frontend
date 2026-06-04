import api from './api';

export const pagosService = {
  /**
   * Pide al backend que cree una orden segura en PayPal para una Penca específica.
   */
  crearOrden: async (pencaInstanciaId: number) => {
    const response = await api.post('/pagos/crear-orden', {
      pencaInstanciaId
    });
    return response.data; // { orderId, pagoId }
  },

  /**
   * Le avisa al backend que el usuario ya aprobó el pago en la ventanita de PayPal,
   * para que el backend lo capture y verifique.
   */
  confirmarPago: async (pagoId: number, orderId: string) => {
    const response = await api.post('/pagos/confirmar', {
      pagoId,
      orderId
    });
    return response.data;
  }
};
