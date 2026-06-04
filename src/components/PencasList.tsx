import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { pencasService } from '../api/pencasService';
import type { PencaAPI } from '../api/pencasService';
import { authService } from '../api/authService';

const PencasList: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [pencas, setPencas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

 
   useEffect(() => {
     const fetch = async () => {
       try {
         const data = await authService.getPencas();
         setPencas(data);
       } catch (err: any) {
         setError(err.response?.data?.mensaje || 'Error cargando pencas');
       } finally {
         setLoading(false);
       }
     };
     fetch();
   }, []);


  if (loading) return <p>Cargando pencas...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  const misParticipacion = pencas.filter(p => p.participacion !== null);
  const sinParticipacion = pencas.filter(p => p.participacion === null);

  const cargarPencas = async () => {
    try {
      setLoading(true);
      const data = await authService.getPencas();
      setPencas(data);
    } catch (err: any) {
      console.error(err);
      setError('Ocurrió un error al cargar las pencas disponibles.');
    } finally {
      setLoading(false);
    }
  };

  const handleParticipar = (pencaInstanciaId: number) => {
    navigate(`/${slug}/checkout/${pencaInstanciaId}`);
  };

  const handleVerPenca = (pencaInstanciaId: number) => {
    // Por ahora alertamos, en el futuro irá a la vista de torneo
    alert(`¡Pronto podrás ver tu penca (ID: ${pencaInstanciaId}) y hacer predicciones!`);
  };

  if (loading) {
    return <p className="text-center text-muted">Cargando pencas...</p>;
  }

  if (error) {
    return <p className="text-center" style={{ color: 'red' }}>{error}</p>;
  }

  if (pencas.length === 0) {
    return <p className="text-center text-muted">No hay pencas activas en este sitio por el momento.</p>;
  }

    const cardStyle: React.CSSProperties = {
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    };
  
    const gridStyle: React.CSSProperties = {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 400px))',
      gap: '20px',
    };
  
  const renderCard = (p: any) => (
    <div key={p.id} style={cardStyle}>
      <div>
        <h2 style={{ margin: 0, marginBottom: '12px', fontSize: '24px' }}>{p.nombre}</h2>
        <p><strong>Equipos:</strong> {p.cantidadEquipos}</p>

        {p.participacion ? (
          <>
            <p><strong>Puntaje:</strong> {p.participacion.puntajeTotal}</p>
            <p><strong>Estado:</strong> {p.participacion.estaPagado ? 'Pagado' : 'Pendiente'}</p>
          </>
        ) : (
          <p style={{ color: '#6b7280' }}>Todavía no participás en esta penca</p>
        )}
      </div>

      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        {p.participacion ? (
          <>
            <button
              style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '10px', backgroundColor: '#2563eb', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
              onClick={() => navigate(`/${slug}/partidos/${p.participacion.id}/${p.id}`)}
            >
              Acceder
            </button>
          </>
        ) : (
          <button
            style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '10px', backgroundColor: '#f59e0b', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Unirse
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ padding: '0' }}>

      {misParticipacion.length > 0 ? (
  <>
    <h2>Mis pencas</h2>
    <div style={{ ...gridStyle, marginBottom: '40px' }}>
      {misParticipacion.map(renderCard)}
    </div>
  </>
) : (
  <p style={{ color: '#6b7280', marginBottom: '40px' }}>Todavía no participás en ninguna penca.</p>
)}
      {sinParticipacion.length > 0 && (
        <>
          <h2 style={{ marginBottom: '16px', fontSize: '22px', color: '#1f2937' }}>Otras pencas</h2>
          <div style={gridStyle}>
            {sinParticipacion.map(renderCard)}
          </div>
        </>
      )}

      {pencas.length === 0 && <p>No hay pencas disponibles</p>}
    </div>
  );
};


export default PencasList;
