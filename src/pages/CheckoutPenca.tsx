import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { pagosService } from '../api/pagosService';

const CheckoutPenca: React.FC = () => {
  const { slug, pencaInstanciaId } = useParams<{ slug: string; pencaInstanciaId: string }>();
  const navigate = useNavigate();
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const currentPagoIdRef = useRef<number | null>(null);

  const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;

  if (!clientId) {
    return (
      <div className="container-simple text-center">
        <p style={{ color: 'red' }}>Error: Faltan configurar las credenciales de PayPal en el frontend (.env.local)</p>
      </div>
    );
  }

  const handleCreateOrder = async () => {
    try {
      setError('');
      // Llamamos al backend para que él cree la orden de forma segura
      const result = await pagosService.crearOrden(Number(pencaInstanciaId));
      currentPagoIdRef.current = result.pagoId; // Guardamos el ID en una Ref para que onApprove lo lea
      return result.orderId;
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'No se pudo iniciar la transacción. Verifica tu conexión.');
      throw err;
    }
  };

  const handleApprove = async (data: any) => {
    try {
      if (!currentPagoIdRef.current) throw new Error("No se encontró el ID del pago.");
      
      // Le avisamos al backend que PayPal aprobó la orden
      await pagosService.confirmarPago(currentPagoIdRef.current, data.orderID);
      
      setSuccess(true);
      setTimeout(() => {
        navigate(`/${slug}`);
      }, 3000);
      
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'El pago fue aprobado por PayPal pero falló la confirmación en nuestro servidor.');
    }
  };

  const handleError = (err: any) => {
    console.error("PayPal Error:", err);
    setError('Ocurrió un error con el widget de PayPal.');
  };

  const handleCancel = () => {
    setError('El pago fue cancelado.');
  };

  return (
    <div className="container-simple text-center" style={{ maxWidth: '500px' }}>
      <h2 style={{ marginBottom: '20px' }}>Pagar Entrada</h2>
      <p className="text-muted" style={{ marginBottom: '30px' }}>
        Estás a punto de pagar tu entrada para participar en la penca.
      </p>

      {success ? (
        <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '15px', borderRadius: '5px' }}>
          <h3>¡Pago exitoso!</h3>
          <p>Ya estás participando. Redirigiendo al inicio...</p>
        </div>
      ) : (
        <>
          {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}
          
          <PayPalScriptProvider options={{ "clientId": clientId, currency: "USD", intent: "capture" }}>
            <PayPalButtons
              createOrder={handleCreateOrder}
              onApprove={handleApprove}
              onError={handleError}
              onCancel={handleCancel}
              style={{ layout: "vertical", shape: "rect", color: "gold" }}
            />
          </PayPalScriptProvider>
          
          <button 
            className="btn-secondary mt-4" 
            onClick={() => navigate(`/${slug}/dashboard`)}
          >
            Cancelar y Volver
          </button>
        </>
      )}
    </div>
  );
};

export default CheckoutPenca;
