import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { pencasService } from '../api/pencasService';
import type { PencaAPI } from '../api/pencasService';

const PencasList: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [pencas, setPencas] = useState<PencaAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (slug) {
      cargarPencas();
    }
  }, [slug]);

  const cargarPencas = async () => {
    try {
      setLoading(true);
      const data = await pencasService.getPencasDelSitio(slug!);
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

  const handleVerPenca = (participacionId: number) => {
    // Por ahora alertamos, en el futuro irá a la vista de torneo
        navigate(`/${slug}/partidos/${participacionId}`)
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

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginTop: '20px', textAlign: 'left' }}>
      {pencas.map((p) => (
        <div key={p.id} style={{ 
            backgroundColor: '#fff', 
            border: '1px solid var(--border-color)', 
            borderRadius: '8px', 
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{ margin: '0 0 5px 0' }}>{p.nombre}</h3>
            <p className="text-muted" style={{ margin: '0 0 10px 0' }}>Deporte: {p.deporte}</p>
            <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#28a745', marginBottom: '20px' }}>
              Costo: ${p.costo.toFixed(2)} USD
            </p>
          </div>
          
          <div>
            {p.yaParticipa ? (
              <button 
                onClick={() => handleVerPenca(p.idParticipacion)}
                className="btn-secondary"
                style={{ borderColor: '#28a745', color: '#28a745', width: '100%' }}
              >
                Ver Mi Penca
              </button>
            ) : (
              <button 
                onClick={() => handleParticipar(p.id)}
                className="btn-primary"
                style={{ width: '100%' }}
              >
                Pagar Entrada
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PencasList;
