import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { prediccionService } from '../api/prediccionService';
import { useAuth } from '../contexts/AuthContext';
import Chat from './Chat';

// Cuántos grupos de fecha mostrar por página
const FECHAS_POR_PAGINA = 3;

const Partidos = () => {
  const { idParticipacion } = useParams();
  const [partidos, setPartidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [golesLocal, setGolesLocal] = useState('');
  const [golesVisitante, setGolesVisitante] = useState('');
  const [partidoSeleccionado, setPartidoSeleccionado] = useState<any>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { user } = useAuth();
  const [tab, setTab] = useState<'apostables' | 'finalizados'>('apostables');
  const [estadisticasPartido, setEstadisticasPartido] = useState<any>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  // ── Paginación ────────────────────────────────────────────────────────────
  const [pagina, setPagina] = useState(0);

  const apostables = partidos.filter(p => !p.jugado);
  const finalizados = partidos.filter(p => p.jugado);

  const modalBloqueado =
    partidoSeleccionado?.jugado ||
    new Date(partidoSeleccionado?.fecha ?? '') <= new Date();

  const agruparPorFecha = (lista: any[], descendente = false) => {
    const sorted = [...lista].sort((a, b) => {
      const diff = new Date(a.fecha + 'Z').getTime() - new Date(b.fecha + 'Z').getTime();
      return descendente ? -diff : diff;
    });

    return sorted.reduce((acc, partido) => {
      console.log('fecha raw:', partido.fecha)
      console.log('sin Z:', new Date(partido.fecha).toString())
      console.log('con Z:', new Date(partido.fecha + 'Z').toString())
      
      const fechaPartido = new Date(partido.fecha + 'Z');
      const hoy = new Date();
      const manana = new Date();
      manana.setDate(hoy.getDate() + 1);

      const esHoy = fechaPartido.toDateString() === hoy.toDateString();
      const esManana = fechaPartido.toDateString() === manana.toDateString();

      const fecha = esHoy
        ? '⚽ Hoy'
        : esManana
        ? '⚽ Mañana'
        : fechaPartido.toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'long' });

      if (!acc.has(fecha)) acc.set(fecha, []);
      acc.get(fecha)!.push(partido);
      return acc;
    }, new Map<string, any[]>());
  };

  const abrirModal = async (partido: any) => {
    setPartidoSeleccionado(partido);
    setGolesLocal(partido.prediccion?.golesEquipoLocal ?? '0');
    setGolesVisitante(partido.prediccion?.golesEquipoVisitante ?? '0');

    if (partido.jugado) {
      try {
        await obtenerEstadisticas(partido.id);
      } catch (err) {
        console.error('El endpoint de estadísticas falló, abriendo modal en modo seguro:', err);
      }
    } else {
      await obtenerTendencia(partido.id);
    }

    dialogRef.current?.showModal();
  };

  const handleGuardar = async (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    try {
      await prediccionService.realizarPrediccion(
        Number(partidoSeleccionado.prediccion?.id ?? 0),
        Number(golesLocal),
        Number(golesVisitante),
        Number(idParticipacion),
        partidoSeleccionado.id
      );
      setPartidos(prev =>
        prev.map(p => {
          if (p.id !== partidoSeleccionado.id) return p;
          return {
            ...p,
            prediccion: {
              ...(p.prediccion ?? {}),
              golesEquipoLocal: Number(golesLocal),
              golesEquipoVisitante: Number(golesVisitante),
              puntosObtenidos: p.prediccion?.puntosObtenidos ?? 0,
            },
          };
        })
      );
      dialogRef.current?.close();
    } catch (error: any) {
      console.error('Error al guardar:', error);
      if (error.response?.status === 400) {
        alert('⚽ El partido ya comenzó, no podés apostar.');
      }
    }
  };

  const fetchPartidos = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const data = await prediccionService.getPartidosPenca(Number(idParticipacion));
      setPartidos(data);
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Error cargando partidos');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const obtenerTendencia = async (partidoId: number) => {
    try {
      const data = await prediccionService.tendenciaPredicciones(partidoId);
      setEstadisticasPartido(data);
    } catch (error) {
      console.error('Error al obtener estadísticas del backend:', error);
      setEstadisticasPartido(null);
      throw error;
    }
  };

  const obtenerEstadisticas = async (partidoId: number) => {
    try {
      const data = await prediccionService.resultadosPredicciones(partidoId);
      setEstadisticasPartido(data ?? null);
    } catch (error) {
      console.error('Error al traer las estadísticas:', error);
      setEstadisticasPartido(null);
    }
  };

  const calcularTextoPuntos = (partido: any) => {
    if (!partido.jugado || !partido.prediccion) return '0 PTS';
    const { golesEquipoLocal: pL, golesEquipoVisitante: pV } = partido.prediccion;
    const { golesLocal: rL, golesVisitante: rV } = partido;
    if (pL === rL && pV === rV) return 'Exacto +10 PTS';
    if (partido.prediccion.puntosObtenidos === 5) return 'Acierto +5';
    return 'Fallaste +0';
  };

  const colorPrediccion = (partido: any) => {
    if (!partido.jugado || !partido.prediccion) return null;
    const { golesEquipoLocal: pL, golesEquipoVisitante: pV } = partido.prediccion;
    const { golesLocal: rL, golesVisitante: rV } = partido;
    if (pL === rL && pV === rV) return '#16a34a';
    const ganadorReal = rL > rV ? 'L' : rV > rL ? 'V' : 'E';
    const ganadorPred = pL > pV ? 'L' : pV > pL ? 'V' : 'E';
    if (ganadorReal === ganadorPred) return '#84cc16';
    return '#dc2626';
  };

  const colorPrediccionEnVivo = (partido: any) => {
    if (!partido.prediccion) return '#9ca3af';
    const { golesEquipoLocal: pL, golesEquipoVisitante: pV } = partido.prediccion;
    const rL = partido.golesLocal ?? 0;
    const rV = partido.golesVisitante ?? 0;
    if (pL === rL && pV === rV) return '#16a34a';
    const ganadorReal = rL > rV ? 'L' : rV > rL ? 'V' : 'E';
    const ganadorPred = pL > pV ? 'L' : pV > pL ? 'V' : 'E';
    if (ganadorReal === ganadorPred) return '#84cc16';
    return '#dc2626';
  };

  const handleTabChange = (t: 'apostables' | 'finalizados') => {
    setTab(t);
    setPagina(0); // resetear página al cambiar de tab
    tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    if (idParticipacion) fetchPartidos();
  }, [idParticipacion]);

  // Resetear página cuando cambian los partidos (refresh por SignalR)
  useEffect(() => {
    setPagina(0);
  }, [partidos.length]);

  useEffect(() => {
    const hayEnJuego = partidos.some(p => !p.jugado && new Date(p.fecha + 'Z') <= new Date());
    if (!hayEnJuego) return;
    const interval = setInterval(() => fetchPartidos(false), 30000);
    return () => clearInterval(interval);
  }, [partidos]);

  // ─── Estilos ──────────────────────────────────────────────────────────────
  const s = {
    page: { fontFamily: 'var(--font-family)' } as React.CSSProperties,

    tabsBar: {
      position: 'sticky' as const,
      top: 50,
      zIndex: 10,
      background: 'var(--bg-color)',
      borderBottom: '1px solid var(--border-color)',
      padding: '20px 24px 0 24px',
    } as React.CSSProperties,
    tabsRow: { display: 'flex', gap: 4 } as React.CSSProperties,
    tabButton: (active: boolean): React.CSSProperties => ({
      padding: '10px 20px',
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      fontWeight: 700,
      fontSize: 13,
      textTransform: 'uppercase',
      letterSpacing: 1,
      color: active ? 'var(--primary-color)' : '#9ca3af',
      borderBottom: active ? '2px solid var(--primary-color)' : '2px solid transparent',
      marginBottom: -1,
      fontFamily: 'var(--font-family)',
    }),

    content: { padding: '32px 24px', fontFamily: 'var(--font-family)' } as React.CSSProperties,

    emptyState: { textAlign: 'center' as const, padding: '60px 0', color: '#9ca3af' } as React.CSSProperties,
    emptyIcon: { fontSize: 40, marginBottom: 12 } as React.CSSProperties,
    emptyTitle: { fontWeight: 700, fontSize: 15, color: 'var(--text-color)' } as React.CSSProperties,
    emptySubtitle: { fontSize: 13, marginTop: 4 } as React.CSSProperties,

    dateGroup: { marginBottom: 36 } as React.CSSProperties,
    dateHeader: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 } as React.CSSProperties,
    dateLabel: {
      fontSize: 14,
      fontWeight: 700,
      textTransform: 'uppercase' as const,
      letterSpacing: 1,
      color: 'var(--primary-color)',
      whiteSpace: 'nowrap' as const,
    } as React.CSSProperties,
    dateDivider: { flex: 1, height: 1, background: 'var(--border-color)' } as React.CSSProperties,

    matchGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      maxWidth: '1200px',
      gap: 16,
      width: '100%',
      boxSizing: 'border-box' as const,
    } as React.CSSProperties,

    matchCard: (empezado: boolean): React.CSSProperties => ({
      background: '#fff',
      border: empezado ? '1px solid #16a34a33' : '1px solid var(--border-color)',
      borderRadius: 12,
      padding: '16px 20px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      width: '100%',
      boxSizing: 'border-box',
      cursor: 'pointer',
      transition: 'border-color 0.15s',
    }),

    cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: 12 } as React.CSSProperties,
    cardPhase: { fontSize: 11, color: '#9ca3af', fontWeight: 600 } as React.CSSProperties,
    cardDate: { fontSize: 11, color: '#9ca3af' } as React.CSSProperties,

    cardBody: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    } as React.CSSProperties,
    teamCol: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      gap: 8,
      flex: '1 1 0%',
      minWidth: 0,
    } as React.CSSProperties,
    teamLogo: { width: 40, height: 40, borderRadius: 10 } as React.CSSProperties,
    teamName: {
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--text-color)',
      textAlign: 'center' as const,
      whiteSpace: 'nowrap' as const,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      width: '100%',
    } as React.CSSProperties,

    scoreCenter: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      gap: 6,
      width: 130,
      flexShrink: 0,
    } as React.CSSProperties,
    scoreRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 } as React.CSSProperties,
    scoreBox: (hasValue: boolean): React.CSSProperties => ({
      width: 40,
      height: 40,
      borderRadius: 8,
      background: hasValue ? '#eff6ff' : 'var(--bg-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }),
    scoreNumber: (jugado: boolean): React.CSSProperties => ({
      fontWeight: 800,
      fontSize: 20,
      color: jugado ? 'var(--text-color)' : '#9ca3af',
    }),
    scoreSep: { fontSize: 12, color: 'var(--border-color)', fontWeight: 600 } as React.CSSProperties,

    predBadge: (color: string): React.CSSProperties => ({
      fontSize: 11,
      fontWeight: 800,
      padding: '2px 8px',
      borderRadius: 4,
      background: color === '#16a34a' ? '#16a34a' : 'transparent',
      color: color === '#16a34a' ? '#fff' : color,
      border: `1px solid ${color}`,
      letterSpacing: 0.5,
    }),

    cardFooter: {
      borderTop: '1px solid var(--bg-color)',
      paddingTop: 10,
      textAlign: 'center' as const,
    } as React.CSSProperties,
    cardFooterFinished: { fontSize: 12, color: '#6b7280', fontWeight: 600 } as React.CSSProperties,
    cardFooterLive: {
      fontSize: 11,
      fontWeight: 700,
      color: '#16a34a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
    } as React.CSSProperties,
    liveDot: {
      width: 7,
      height: 7,
      borderRadius: '50%',
      background: '#16a34a',
      display: 'inline-block',
    } as React.CSSProperties,
    cardFooterAction: { fontSize: 12, color: 'var(--primary-color)', fontWeight: 600 } as React.CSSProperties,

    // ── Paginación ──────────────────────────────────────────────────────────
    pagination: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 8,
      paddingTop: 24,
      borderTop: '1px solid var(--border-color)',
    } as React.CSSProperties,
    pageBtn: (disabled: boolean): React.CSSProperties => ({
      padding: '7px 16px',
      borderRadius: 8,
      border: '1px solid var(--border-color)',
      background: disabled ? 'var(--bg-color)' : '#fff',
      color: disabled ? '#d1d5db' : 'var(--text-color)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontSize: 13,
      fontWeight: 600,
      fontFamily: 'var(--font-family)',
      transition: 'opacity 0.15s',
    }),
    pageInfo: {
      fontSize: 12,
      color: '#9ca3af',
      fontWeight: 500,
      minWidth: 80,
      textAlign: 'center' as const,
    } as React.CSSProperties,
    // ───────────────────────────────────────────────────────────────────────

    modal: {
      borderRadius: 12,
      padding: 28,
      border: '1px solid var(--border-color)',
      minWidth: 360,
      maxWidth: 420,
      position: 'fixed' as const,
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      margin: 0,
      boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
      fontFamily: 'var(--font-family)',
    } as React.CSSProperties,

    modalTeamsRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      marginTop: 8,
      marginBottom: 24,
    } as React.CSSProperties,
    modalTeamCol: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      gap: 6,
      flex: '1 1 0%',
      minWidth: 0,
    } as React.CSSProperties,
    modalLogo: {
      width: 58,
      height: 58,
      objectFit: 'contain' as const,
      borderRadius: 8,
      background: 'var(--bg-color)',
      padding: 4,
    } as React.CSSProperties,
    modalTeamName: {
      fontWeight: 700,
      fontSize: 14,
      color: 'var(--text-color)',
      textAlign: 'center' as const,
      whiteSpace: 'nowrap' as const,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      width: '100%',
    } as React.CSSProperties,
    modalVs: {
      fontSize: 11,
      fontWeight: 600,
      color: '#9ca3af',
      textTransform: 'uppercase' as const,
      letterSpacing: 1,
      paddingBottom: 20,
    } as React.CSSProperties,

    golesRow: {
      display: 'flex',
      gap: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 15,
    } as React.CSSProperties,
    golesGroup: { display: 'flex', alignItems: 'center', gap: 10 } as React.CSSProperties,
    golesBtn: (blocked: boolean): React.CSSProperties => ({
      width: 34,
      height: 34,
      cursor: blocked ? 'not-allowed' : 'pointer',
      borderRadius: 6,
      border: '1px solid var(--border-color)',
      fontSize: 18,
      opacity: blocked ? 0.5 : 1,
      background: '#fff',
    }),
    golesNum: {
      width: 36,
      textAlign: 'center' as const,
      fontWeight: 800,
      fontSize: 30,
      color: 'var(--text-color)',
    } as React.CSSProperties,
    golesSep: { fontWeight: 700, fontSize: 26, color: 'var(--border-color)' } as React.CSSProperties,

    statsSection: {
      borderTop: '1px solid var(--bg-color)',
      paddingTop: 0,
      marginBottom: 24,
    } as React.CSSProperties,
    myPredRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: 'var(--bg-color)',
      border: '1px solid var(--bg-color)',
      borderRadius: 8,
      padding: '10px 14px',
      marginBottom: 10,
    } as React.CSSProperties,
    myPredLabel: { fontSize: 12, fontWeight: 600, color: '#4b5563' } as React.CSSProperties,
    groupHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px dashed var(--border-color)',
      paddingBottom: 10,
      marginBottom: 4,
    } as React.CSSProperties,
    groupTitle: {
      fontSize: 12,
      fontWeight: 700,
      color: 'var(--text-color)',
      textTransform: 'uppercase' as const,
      letterSpacing: 0.5,
    } as React.CSSProperties,
    groupCount: {
      fontSize: 11,
      fontWeight: 600,
      color: '#6b7280',
      background: 'var(--bg-color)',
      padding: '2px 8px',
      borderRadius: 12,
    } as React.CSSProperties,

    tendenciaLabel: {
      fontSize: 12,
      fontWeight: 700,
      color: 'var(--text-color)',
      textTransform: 'uppercase' as const,
      letterSpacing: 0.5,
    } as React.CSSProperties,

    modalActions: { display: 'flex', gap: 8, justifyContent: 'flex-end' } as React.CSSProperties,
    btnCancel: {
      padding: '8px 16px',
      borderRadius: 8,
      border: '1px solid var(--border-color)',
      cursor: 'pointer',
      fontSize: 13,
      fontWeight: 500,
      color: 'var(--text-color)',
      background: '#fff',
    } as React.CSSProperties,
    btnSave: {
      padding: '8px 16px',
      backgroundColor: 'var(--primary-color)',
      color: 'var(--primary-text-color)',
      border: 'none',
      borderRadius: 8,
      cursor: 'pointer',
      fontWeight: 600,
      fontSize: 13,
    } as React.CSSProperties,
  };
  // ─────────────────────────────────────────────────────────────────────────

  if (loading) return <div style={{ padding: 20, fontFamily: 'var(--font-family)' }}>Cargando partidos...</div>;
  if (error) return <div style={{ padding: 20, color: '#dc2626', fontFamily: 'var(--font-family)' }}>{error}</div>;

  const listaActiva = tab === 'apostables' ? apostables : finalizados;
  const gruposFecha = [...agruparPorFecha(listaActiva, tab === 'finalizados')];
  const totalPaginas = Math.ceil(gruposFecha.length / FECHAS_POR_PAGINA);
  const gruposPagina = gruposFecha.slice(pagina * FECHAS_POR_PAGINA, (pagina + 1) * FECHAS_POR_PAGINA);

  return (
    <div style={s.page}>

      {/* TABS */}
      <div ref={tabsRef} style={s.tabsBar}>
        <div style={s.tabsRow}>
          {(['apostables', 'finalizados'] as const).map(t => (
            <button key={t} onClick={() => handleTabChange(t)} style={s.tabButton(tab === t)}>
              {t === 'apostables' ? 'Próximos' : 'Finalizados'}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENIDO */}
      <div style={s.content}>
        {listaActiva.length === 0 ? (
          tab === 'finalizados' ? (
            <div style={s.emptyState}>
              <div style={s.emptyIcon}>⏳</div>
              <p style={s.emptyTitle}>Aún no hay partidos finalizados</p>
              <p style={s.emptySubtitle}>Volvé cuando se juegue el primer partido.</p>
            </div>
          ) : (
            <div style={s.emptyState}>
              <div style={s.emptyIcon}>🎉</div>
              <p style={s.emptyTitle}>No quedan partidos por jugar</p>
              <p style={s.emptySubtitle}>Revisá la pestaña de finalizados para ver tus resultados.</p>
            </div>
          )
        ) : (
          <>
            {/* Grupos de la página actual */}
            {gruposPagina.map(([fecha, ps]) => (
              <div key={fecha} style={s.dateGroup}>
                <div style={s.dateHeader}>
                  <span style={s.dateLabel}>{fecha}</span>
                  <div style={s.dateDivider} />
                </div>

                <div style={s.matchGrid}>
                  {(ps as any[]).map((partido) => {
                    const empezado = new Date(partido.fecha + 'Z') <= new Date();
                    const bloqueado = partido.jugado || empezado;

                    return (
                      <div
                        key={partido.id}
                        onClick={() => abrirModal(partido)}
                        style={s.matchCard(empezado)}
                        onMouseEnter={e => {
                          if (!bloqueado) (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--primary-color)';
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLDivElement).style.borderColor =
                            empezado ? '#16a34a33' : 'var(--border-color)';
                        }}
                      >
                        {/* HEADER */}
                        <div style={s.cardHeader}>
                          <span style={s.cardPhase}>{partido.fase}</span>
                          <span style={s.cardDate}>
                            {new Date(partido.fecha + 'Z').toLocaleDateString('es-UY', { day: 'numeric', month: 'numeric' })}
                            {' · '}
                            {new Date(partido.fecha + 'Z').toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit', hour12: false })}
                          </span>
                        </div>

                        {/* CUERPO */}
                        <div style={s.cardBody}>
                          <div style={s.teamCol}>
                            <img src={partido.local.logoUrl} style={s.teamLogo} />
                            <span style={s.teamName}>{partido.local.nombre}</span>
                          </div>

                          <div style={s.scoreCenter}>
                            {empezado ? (
                              <>
                                <div style={s.scoreRow}>
                                  <div style={s.scoreBox(true)}>
                                    <span style={s.scoreNumber(true)}>{partido.golesLocal ?? 0}</span>
                                  </div>
                                  <span style={s.scoreSep}>-</span>
                                  <div style={s.scoreBox(true)}>
                                    <span style={s.scoreNumber(true)}>{partido.golesVisitante ?? 0}</span>
                                  </div>
                                </div>
                                {partido.prediccion ? (() => {
                                  const color = colorPrediccionEnVivo(partido);
                                  return (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                      <div style={s.predBadge(color)}>
                                        {partido.prediccion.golesEquipoLocal} - {partido.prediccion.golesEquipoVisitante}
                                      </div>
                                    </div>
                                  );
                                })() : (
                                  <div style={{ fontSize: 10, color: '#9ca3af', fontStyle: 'italic' }}>Sin predicción</div>
                                )}
                              </>
                            ) : (
                              <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                  <div style={s.scoreBox(partido.jugado || !!partido.prediccion)}>
                                    <span style={s.scoreNumber(partido.jugado)}>
                                      {partido.jugado ? partido.golesLocal : (partido.prediccion?.golesEquipoLocal ?? '')}
                                    </span>
                                  </div>
                                  <span style={s.scoreSep}>VS</span>
                                  <div style={s.scoreBox(partido.jugado || !!partido.prediccion)}>
                                    <span style={s.scoreNumber(partido.jugado)}>
                                      {partido.jugado ? partido.golesVisitante : (partido.prediccion?.golesEquipoVisitante ?? '')}
                                    </span>
                                  </div>
                                </div>
                                <div style={{ height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  {partido.prediccion && partido.jugado ? (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                      <div style={s.predBadge(colorPrediccion(partido) ?? '#9ca3af')}>
                                        {partido.prediccion.golesEquipoLocal} - {partido.prediccion.golesEquipoVisitante}
                                      </div>
                                      <div style={s.predBadge(colorPrediccion(partido) ?? '#9ca3af')}>
                                        +{partido.prediccion.puntosObtenidos ?? 0} PTS
                                      </div>
                                    </div>
                                  ) : partido.prediccion ? (
                                    <div />
                                  ) : (
                                    <div style={{ fontSize: 10, color: '#9ca3af', fontStyle: 'italic' }}>Sin predicción</div>
                                  )}
                                </div>
                              </>
                            )}
                          </div>

                          <div style={s.teamCol}>
                            <img src={partido.visitante.logoUrl} style={s.teamLogo} />
                            <span style={s.teamName}>{partido.visitante.nombre}</span>
                          </div>
                        </div>

                        {/* FOOTER */}
                        <div style={s.cardFooter}>
                          {partido.jugado
                            ? <span style={s.cardFooterFinished}>Partido finalizado</span>
                            : empezado
                            ? (
                              <span style={s.cardFooterLive}>
                                <span style={s.liveDot} />
                                EN JUEGO
                              </span>
                            )
                            : <span style={s.cardFooterAction}>⊕ PRONOSTICAR</span>
                          }
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* PAGINACIÓN — solo si hay más de una página */}
            {totalPaginas > 1 && (
              <div style={s.pagination}>
                <button
                  disabled={pagina === 0}
                  onClick={() => { setPagina(p => p - 1); tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
                  style={s.pageBtn(pagina === 0)}
                >
                  ← Anterior
                </button>

                <span style={s.pageInfo}>
                  {pagina + 1} / {totalPaginas}
                </span>

                <button
                  disabled={pagina === totalPaginas - 1}
                  onClick={() => { setPagina(p => p + 1); tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
                  style={s.pageBtn(pagina === totalPaginas - 1)}
                >
                  Siguiente →
                </button>
              </div>
            )}
          </>
        )}

        {/* MODAL */}
        <dialog ref={dialogRef} style={s.modal}>
          <div style={s.modalTeamsRow}>
            <div style={s.modalTeamCol}>
              <img src={partidoSeleccionado?.local?.logoUrl} alt={partidoSeleccionado?.local?.nombre} style={s.modalLogo} />
              <span style={s.modalTeamName}>{partidoSeleccionado?.local?.nombre}</span>
            </div>
            <span style={s.modalVs}>vs</span>
            <div style={s.modalTeamCol}>
              <img src={partidoSeleccionado?.visitante?.logoUrl ?? 'https://via.placeholder.com/48'} alt={partidoSeleccionado?.visitante?.nombre} style={s.modalLogo} />
              <span style={s.modalTeamName}>{partidoSeleccionado?.visitante?.nombre}</span>
            </div>
          </div>

          <div style={s.golesRow}>
            <div style={s.golesGroup}>
              <button disabled={modalBloqueado} onClick={() => setGolesLocal(v => String(Math.max(0, Number(v) - 1)))} style={s.golesBtn(modalBloqueado)}>−</button>
              <span style={s.golesNum}>
                {modalBloqueado ? (partidoSeleccionado?.jugado ? partidoSeleccionado?.golesLocal : golesLocal) : golesLocal}
              </span>
              <button disabled={modalBloqueado} onClick={() => setGolesLocal(v => String(Number(v) + 1))} style={s.golesBtn(modalBloqueado)}>+</button>
            </div>
            <span style={s.golesSep}>-</span>
            <div style={s.golesGroup}>
              <button disabled={modalBloqueado} onClick={() => setGolesVisitante(v => String(Math.max(0, Number(v) - 1)))} style={s.golesBtn(modalBloqueado)}>−</button>
              <span style={s.golesNum}>
                {modalBloqueado ? (partidoSeleccionado?.jugado ? partidoSeleccionado?.golesVisitante : golesVisitante) : golesVisitante}
              </span>
              <button disabled={modalBloqueado} onClick={() => setGolesVisitante(v => String(Number(v) + 1))} style={s.golesBtn(modalBloqueado)}>+</button>
            </div>
          </div>

          <div style={s.statsSection}>
            {partidoSeleccionado?.jugado ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={s.myPredRow}>
                  <span style={s.myPredLabel}>Tu predicción:</span>
                  {partidoSeleccionado?.prediccion ? (() => {
                    const color = colorPrediccion(partidoSeleccionado) ?? '#9ca3af';
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ ...s.predBadge(color), fontSize: 12, padding: '4px 10px', borderRadius: 6 }}>
                          {partidoSeleccionado.prediccion.golesEquipoLocal} - {partidoSeleccionado.prediccion.golesEquipoVisitante}
                        </div>
                        <div style={{ ...s.predBadge(color), fontSize: 12, padding: '4px 10px', borderRadius: 6 }}>
                          {calcularTextoPuntos(partidoSeleccionado)}
                        </div>
                      </div>
                    );
                  })() : (
                    <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500, fontStyle: 'italic' }}>No ingresaste predicción</span>
                  )}
                </div>

                <div style={s.groupHeader}>
                  <span style={s.groupTitle}>Resultados del Grupo</span>
                  <span style={s.groupCount}>{estadisticasPartido?.totalPredicciones ?? 0} predicciones</span>
                </div>

                {[
                  { label: 'Resultado exacto', cant: estadisticasPartido?.cantidadExacto, pct: estadisticasPartido?.porcentajeExacto, color: '#16a34a' },
                  { label: 'Ganador o empate', cant: estadisticasPartido?.cantidadTendencia, pct: estadisticasPartido?.porcentajeTendencia, color: '#ca8a04', barColor: '#eab308' },
                  { label: 'No sumaron puntos', cant: estadisticasPartido?.cantidadPerdedores, pct: estadisticasPartido?.porcentajePerdedores, color: '#dc2626', barColor: '#ef4444' },
                ].map(({ label, cant, pct, color, barColor }) => (
                  <div key={label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 12, marginBottom: 4 }}>
                      <div>
                        <span style={{ fontWeight: 600, color: '#4b5563' }}>{label} </span>
                        <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 4 }}>({cant ?? 0} personas)</span>
                      </div>
                      <span style={{ fontWeight: 700, color }}>{pct ?? 0}%</span>
                    </div>
                    <div style={{ width: '100%', height: 8, background: 'var(--bg-color)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${pct ?? 0}%`, height: '100%', background: barColor ?? color, borderRadius: 4 }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={s.tendenciaLabel}>Tendencia de apuestas</span>
                {!estadisticasPartido ? (
                  <div style={{ height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 11, color: '#9ca3af', fontStyle: 'italic' }}>Cargando tendencias...</span>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', marginTop: 4 }}>
                      <div style={{ width: `${estadisticasPartido.porcentajes?.local ?? 34}%`, background: 'var(--primary-color)', transition: 'width 0.3s' }} title="Local" />
                      <div style={{ width: `${estadisticasPartido.porcentajes?.empate ?? 33}%`, background: 'var(--border-color)', transition: 'width 0.3s' }} title="Empate" />
                      <div style={{ width: `${estadisticasPartido.porcentajes?.visitante ?? 33}%`, background: '#ef4444', transition: 'width 0.3s' }} title="Visitante" />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, color: '#4b5563', marginTop: 4 }}>
                      <span>L: {estadisticasPartido.porcentajes?.local ?? 34}%</span>
                      <span style={{ color: '#9ca3af' }}>E: {estadisticasPartido.porcentajes?.empate ?? 33}%</span>
                      <span>V: {estadisticasPartido.porcentajes?.visitante ?? 33}%</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div style={s.modalActions}>
            <button onClick={() => dialogRef.current?.close()} style={s.btnCancel}>
              {modalBloqueado ? 'Cerrar' : 'Cancelar'}
            </button>
            {!modalBloqueado && (
              <button onClick={(e) => { e.stopPropagation(); handleGuardar(); }} style={s.btnSave}>
                Guardar Predicción
              </button>
            )}
          </div>
        </dialog>

        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}>
          <Chat participacionId={Number(idParticipacion)} />
        </div>
      </div>
    </div>
  );
};

export default Partidos;