import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Leaderboard from '../components/Leaderboard';
import Partidos from '../components/Partidos';
import { useSignalR } from '../hooks/useSignalR';

const PencaDashboard: React.FC = () => {
  const { slug, pencaInstanciaId } = useParams();
  const navigate = useNavigate();

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useSignalR(Number(pencaInstanciaId), () => setRefreshTrigger(prev => prev + 1));

  if (!pencaInstanciaId || !slug) {
    return <p>Penca no encontrada</p>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button 
          onClick={() => navigate(`/${slug}`)} 
          className="btn-back"
          style={{ background: 'transparent', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
        >
          ← Volver
        </button>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ margin: 0 }}>Dashboard de la Penca</h2>
        <p className="text-muted" style={{ margin: 0, marginTop: '5px' }}>Sigue los resultados y la tabla de posiciones en tiempo real.</p>
      </div>

      <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        
        {/* Columna Izquierda: Partidos */}
        <div className="container-simple" style={{ flex: '1 1 500px', padding: '20px' }}>
          <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '20px', color: 'var(--primary-color)' }}>
            Partidos y Predicciones
          </h3>
          <Partidos slug={slug} pencaInstanciaId={Number(pencaInstanciaId)} refreshTrigger={refreshTrigger} />
        </div>

        {/* Columna Derecha: Leaderboard */}
        <div className="container-simple" style={{ flex: '1 1 350px', padding: '20px' }}>
          <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '20px', color: 'var(--primary-color)' }}>
            Tabla de Posiciones
          </h3>
          <Leaderboard pencaInstanciaId={Number(pencaInstanciaId)} refreshTrigger={refreshTrigger} />
        </div>

      </div>
    </div>
  );
};

export default PencaDashboard;
