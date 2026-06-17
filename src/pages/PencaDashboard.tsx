import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Leaderboard from '../components/Leaderboard';
import Partidos from '../components/Partidos';
import { useSignalR } from '../hooks/useSignalR';
import { useLocation } from 'react-router-dom';
import Chat from './Chat';

const PencaDashboard: React.FC = () => {
  const { slug, pencaInstanciaId} = useParams();
  const navigate = useNavigate();

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [participantCount, setParticipantCount] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);

  const location = useLocation();
  const participacionId = location.state?.participacionId;
  const pencaNombre = location.state?.pencaNombre;

  // Header pegajoso con sombra al scrollear
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // SignalR — marca live y dispara refresh con transición suave
  useSignalR(Number(pencaInstanciaId), () => {
    setIsLive(true);
    setIsRefreshing(true);
    setRefreshTrigger(prev => prev + 1);
    setTimeout(() => setIsRefreshing(false), 600);
  });

  if (!pencaInstanciaId || !slug) {
    return <p style={{ padding: 40, textAlign: 'center', color: '#6b7280', fontFamily: 'var(--font-family)' }}>Penca no encontrada</p>;
  }

  return (
    <div style={{ fontFamily: 'var(--font-family)', minHeight: '100vh', background: 'var(--bg-color)' }}>

      {/* HEADER PEGAJOSO */}
      <div style={{
        position: 'sticky',
        top: 60,
        zIndex: 20,
        background: 'var(--bg-color)',
        borderBottom: scrolled ? '1px solid var(--border-color)' : '1px solid transparent',
        boxShadow: scrolled ? '0 3px 10px rgba(0,0,0,0.08)' : '20 1px 4px rgba(0,0,0,0.04)',
        transition: 'box-shadow 0.2s, border-color 0.2s',
        padding: '14px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Volver */}
        <button
          onClick={() => navigate(`/${slug}`)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--primary-color)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            fontWeight: 600,
            fontFamily: 'var(--font-family)',
            padding: '6px 0',
            opacity: 0.85,
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '0.85')}
        >
          ← Volver
        </button>

        {/* Título + indicador en vivo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-color)' }}>
            {pencaNombre}
          </span>
          {/* Indicador en vivo — aparece cuando SignalR recibe al menos un update */}
          {isLive && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#16a34a',
                display: 'inline-block',
                animation: 'pulse-dot 2s infinite',
              }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                En vivo
              </span>
            </div>
          )}
        </div>

        {/* Contador de participantes */}
        <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>
          {participantCount !== null
            ? `${participantCount} participante${participantCount !== 1 ? 's' : ''}`
            : <span style={{ opacity: 0 }}>—</span>
          }
        </div>
      </div>

      {/* Animación del puntito */}
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.7); }
        }
      `}</style>

      {/* CONTENIDO */}
      <div style={{ padding: '28px 24px', maxWidth: 1440, margin: '0 auto', width: '100%' }}>


        {/* Wrapper con transición suave al refresh */}
        <div style={{
          opacity: isRefreshing ? 0.6 : 1,
          transition: 'opacity 0.3s ease',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 4.5fr) minmax(180px, 2fr)',
          gap: 24,
          alignItems: 'flex-start',
          width: '100%',
        }}>

          <style>{`
            .penca-dashboard-partidos,
            .penca-dashboard-leaderboard {
              min-width: 0;
            }

            @media (max-width: 1100px) {
              .penca-dashboard-layout {
                grid-template-columns: 1fr !important;
              }
            }
          `}</style>

          {/* Columna izquierda: Partidos — flex-grow 2 para ocupar ~2/3 del ancho */}
          <div className="container-simple penca-dashboard-layout penca-dashboard-partidos" style={{ padding: 20, maxWidth: 'none', margin: 0, width: '100%' }}>
            <h3 style={{
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: 10,
              marginBottom: 20,
              color: 'var(--primary-color)',
              fontSize: 15,
              fontWeight: 700,
            }}>
              Partidos y Predicciones
            </h3>
            <Partidos
              slug={slug}
              pencaInstanciaId={Number(pencaInstanciaId)}
              participacionId={Number(participacionId)}
              refreshTrigger={refreshTrigger}
            />
          </div>

          {/* Columna derecha: Leaderboard — flex-grow 1 para ocupar ~1/3 del ancho */}
          <div className="container-simple penca-dashboard-layout penca-dashboard-leaderboard" style={{ padding: 20, maxWidth: 340, margin: 0, width: '100%' }}>
            <h3 style={{
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: 10,
              marginBottom: 20,
              color: 'var(--primary-color)',
              fontSize: 15,
              fontWeight: 700,
            }}>
              Tabla de Posiciones
            </h3>
            <Leaderboard
              pencaInstanciaId={Number(pencaInstanciaId)}
              refreshTrigger={refreshTrigger}
              onCountChange={setParticipantCount}
            />
          </div>

        </div>
      </div>

      {/* CHAT FLOTANTE */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}>
        <Chat participacionId={Number(participacionId)} />
      </div>
    </div>
  );
};

export default PencaDashboard;