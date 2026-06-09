import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { prediccionService } from '../api/prediccionService';
import { useAuth } from '../contexts/AuthContext';
import Chat from './Chat';

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

  const apostables = partidos.filter(p => !p.jugado);
  const finalizados = partidos.filter(p => p.jugado);

  // modalBloqueado: true si el partido ya jugó o ya empezó (edge case del job)
  const modalBloqueado =
    partidoSeleccionado?.jugado ||
    new Date((partidoSeleccionado?.fecha ?? '') + 'Z') <= new Date();

  const agruparPorFecha = (lista: any[], descendente = false) => {
    const sorted = [...lista].sort((a, b) => {
      const diff = new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
      return descendente ? -diff : diff;
    });

    return sorted.reduce((acc, partido) => {
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
    if (partido.prediccion.puntosObtenidos === 5) return 'Acierto +5 PTS';
    return '+0 PTS';
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

  // Calcula color de predicción contra resultado parcial (en vivo)
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
    tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    if (idParticipacion) fetchPartidos();
  }, [idParticipacion]);

  // Polling para partidos en juego — reemplazar por SignalR cuando esté listo
  useEffect(() => {
    const hayEnJuego = partidos.some(p => !p.jugado && new Date(p.fecha + 'Z') <= new Date());
    if (!hayEnJuego) return;
    const interval = setInterval(() => fetchPartidos(false), 30000);
    return () => clearInterval(interval);
  }, [partidos]);

  if (loading) return <div style={{ padding: 20 }}>Cargando partidos...</div>;
  if (error) return <div style={{ padding: 20, color: 'red' }}>{error}</div>;

  return (
    <div style={{ fontFamily: "'Barlow', sans-serif" }}>

      {/* TABS */}
      <div ref={tabsRef} style={{ position: 'sticky', top: 50, zIndex: 10, background: 'var(--bg-color)', borderBottom: '1px solid #e5e7eb', padding: '20px 24px 0 24px' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['apostables', 'finalizados'] as const).map(t => (
            <button key={t} onClick={() => handleTabChange(t)} style={{
              padding: '10px 20px', border: 'none', background: 'transparent', cursor: 'pointer',
              fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1,
              color: tab === t ? '#2563eb' : '#9ca3af',
              borderBottom: tab === t ? '2px solid #2563eb' : '2px solid transparent',
              marginBottom: -1, fontFamily: "'Barlow', sans-serif",
            }}>
              {t === 'apostables' ? 'Próximos' : 'Finalizados'}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENIDO */}
      <div style={{ padding: '32px 24px', fontFamily: "'Barlow', sans-serif" }}>
        {tab === 'finalizados' && finalizados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
            <p style={{ fontWeight: 700, fontSize: 15, color: '#6b7280' }}>Aún no hay partidos finalizados</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>Volvé cuando se juegue el primer partido.</p>
          </div>
        ) : tab === 'apostables' && apostables.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
            <p style={{ fontWeight: 700, fontSize: 15, color: '#6b7280' }}>No quedan partidos por jugar</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>Revisá la pestaña de finalizados para ver tus resultados.</p>
          </div>
        ) : (
          [...agruparPorFecha(
            tab === 'apostables' ? apostables : finalizados,
            tab === 'finalizados'
          )].map(([fecha, ps]) => (
            <div key={fecha} style={{ marginBottom: 36 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <span style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#2563eb', whiteSpace: 'nowrap' }}>
                  {fecha}
                </span>
                <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                maxWidth: '1200px',
                gap: 16,
                width: '100%',
                boxSizing: 'border-box',
              }}>
                {(ps as any[]).map((partido) => {
                  const empezado = new Date(partido.fecha + 'Z') <= new Date();
                  const bloqueado = partido.jugado || empezado;

                  return (
                    <div
                      key={partido.id}
                      onClick={() => abrirModal(partido)}
                      style={{
                        background: '#fff',
                        border: empezado ? '1px solid #16a34a33' : '1px solid #e5e7eb',
                        borderRadius: 12,
                        padding: '16px 20px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        width: '100%',
                        boxSizing: 'border-box',
                        cursor: bloqueado ? 'default' : 'pointer',
                        transition: 'border-color 0.15s',
                      }}
                      onMouseEnter={e => { if (!bloqueado) (e.currentTarget as HTMLDivElement).style.borderColor = '#2563eb'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = empezado ? '#16a34a33' : '#e5e7eb'; }}
                    >
                      {/* HEADER */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                        <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>{partido.fase}</span>
                        <span style={{ fontSize: 11, color: '#9ca3af' }}>
                          {new Date(partido.fecha + 'Z').toLocaleDateString('es-UY', { day: 'numeric', month: 'numeric' })}
                          {' · '}
                          {new Date(partido.fecha + 'Z').toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </span>
                      </div>

                      {/* CUERPO */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        {/* Equipo local */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: '1 1 0%', minWidth: 0 }}>
                          <img src={partido.local.logoUrl} style={{ width: 40, height: 40, borderRadius: 10 }} />
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#111827', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                            {partido.local.nombre}
                          </span>
                        </div>

                        {/* Centro */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: 130, flexShrink: 0 }}>
                          {empezado ? (
                            <>
                              {/* Marcador en vivo */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <span style={{ fontWeight: 800, fontSize: 20, color: '#111827' }}>
                                    {partido.golesLocal ?? 0}
                                  </span>
                                </div>
                                <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>-</span>
                                <div style={{ width: 40, height: 40, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <span style={{ fontWeight: 800, fontSize: 20, color: '#111827' }}>
                                    {partido.golesVisitante ?? 0}
                                  </span>
                                </div>
                              </div>
                              {/* Predicción con color en vivo */}
                              {partido.prediccion ? (() => {
                                const color = colorPrediccionEnVivo(partido);
                                return (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <div style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: color === '#16a34a' ? '#16a34a' : 'transparent', color: color === '#16a34a' ? '#fff' : color, border: `1px solid ${color}`, letterSpacing: 0.5 }}>
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
                              {/* Estado normal: predicción o VS */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 8, background: partido.jugado || partido.prediccion ? '#eff6ff' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <span style={{ fontWeight: 800, fontSize: 20, color: partido.jugado ? '#111827' : '#9ca3af' }}>
                                    {partido.jugado ? partido.golesLocal : (partido.prediccion?.golesEquipoLocal ?? '')}
                                  </span>
                                </div>
                                <span style={{ fontSize: 12, color: '#d1d5db', fontWeight: 600 }}>VS</span>
                                <div style={{ width: 40, height: 40, borderRadius: 8, background: partido.jugado || partido.prediccion ? '#eff6ff' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <span style={{ fontWeight: 800, fontSize: 20, color: partido.jugado ? '#111827' : '#9ca3af' }}>
                                    {partido.jugado ? partido.golesVisitante : (partido.prediccion?.golesEquipoVisitante ?? '')}
                                  </span>
                                </div>
                              </div>
                              <div style={{ height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {partido.prediccion && partido.jugado ? (
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                    <div style={{ fontSize: 11, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: colorPrediccion(partido) === '#16a34a' ? '#16a34a' : 'transparent', color: colorPrediccion(partido) === '#16a34a' ? '#fff' : colorPrediccion(partido), border: `1px solid ${colorPrediccion(partido)}`, letterSpacing: 0.5 }}>
                                      {partido.prediccion.golesEquipoLocal} - {partido.prediccion.golesEquipoVisitante}
                                    </div>
                                    <div style={{ fontSize: 11, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: colorPrediccion(partido) === '#16a34a' ? '#16a34a' : 'transparent', color: colorPrediccion(partido) === '#16a34a' ? '#fff' : colorPrediccion(partido), border: `1px solid ${colorPrediccion(partido)}`, letterSpacing: 0.5 }}>
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

                        {/* Equipo visitante */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: '1 1 0%', minWidth: 0 }}>
                          <img src={partido.visitante.logoUrl} style={{ width: 40, height: 40, borderRadius: 10 }} />
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#111827', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                            {partido.visitante.nombre}
                          </span>
                        </div>
                      </div>

                      {/* FOOTER */}
                      <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 10, textAlign: 'center' }}>
                        {partido.jugado
                          ? <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>Partido finalizado</span>
                          : empezado
                          ? (
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
                              EN JUEGO
                            </span>
                          )
                          : <span style={{ fontSize: 12, color: '#2563eb', fontWeight: 600 }}>⊕ PRONOSTICAR</span>
                        }
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}

        {/* MODAL */}
        <dialog ref={dialogRef} style={{
          borderRadius: 12, padding: 28, border: '1px solid #e5e7eb', minWidth: 360, maxWidth: 420,
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', margin: 0,
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
        }}>
          {/* Equipos */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 8, marginBottom: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: '1 1 0%', minWidth: 0 }}>
              <img src={partidoSeleccionado?.local?.logoUrl} alt={partidoSeleccionado?.local?.nombre} style={{ width: 58, height: 58, objectFit: 'contain', borderRadius: 8, background: '#f3f4f6', padding: 4 }} />
              <span style={{ fontWeight: 700, fontSize: 14, color: '#111827', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                {partidoSeleccionado?.local?.nombre}
              </span>
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, paddingBottom: 20 }}>vs</span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: '1 1 0%', minWidth: 0 }}>
              <img src={partidoSeleccionado?.visitante?.logoUrl ?? 'https://via.placeholder.com/48'} alt={partidoSeleccionado?.visitante?.nombre} style={{ width: 58, height: 58, objectFit: 'contain', borderRadius: 8, background: '#f3f4f6', padding: 4 }} />
              <span style={{ fontWeight: 700, fontSize: 14, color: '#111827', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                {partidoSeleccionado?.visitante?.nombre}
              </span>
            </div>
          </div>

          {/* Goles */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 15 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                disabled={modalBloqueado}
                onClick={() => setGolesLocal(v => String(Math.max(0, Number(v) - 1)))}
                style={{ width: 34, height: 34, cursor: modalBloqueado ? 'not-allowed' : 'pointer', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 18, opacity: modalBloqueado ? 0.5 : 1 }}
              >−</button>
              <span style={{ width: 36, textAlign: 'center', fontWeight: 800, fontSize: 30, color: '#111827' }}>
                {modalBloqueado ? (partidoSeleccionado?.jugado ? partidoSeleccionado?.golesLocal : golesLocal) : golesLocal}
              </span>
              <button
                disabled={modalBloqueado}
                onClick={() => setGolesLocal(v => String(Number(v) + 1))}
                style={{ width: 34, height: 34, cursor: modalBloqueado ? 'not-allowed' : 'pointer', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 18, opacity: modalBloqueado ? 0.5 : 1 }}
              >+</button>
            </div>
            <span style={{ fontWeight: 700, fontSize: 26, color: '#d1d5db' }}>-</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                disabled={modalBloqueado}
                onClick={() => setGolesVisitante(v => String(Math.max(0, Number(v) - 1)))}
                style={{ width: 34, height: 34, cursor: modalBloqueado ? 'not-allowed' : 'pointer', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 18, opacity: modalBloqueado ? 0.5 : 1 }}
              >−</button>
              <span style={{ width: 36, textAlign: 'center', fontWeight: 800, fontSize: 30, color: '#111827' }}>
                {modalBloqueado ? (partidoSeleccionado?.jugado ? partidoSeleccionado?.golesVisitante : golesVisitante) : golesVisitante}
              </span>
              <button
                disabled={modalBloqueado}
                onClick={() => setGolesVisitante(v => String(Number(v) + 1))}
                style={{ width: 34, height: 34, cursor: modalBloqueado ? 'not-allowed' : 'pointer', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 18, opacity: modalBloqueado ? 0.5 : 1 }}
              >+</button>
            </div>
          </div>

          {/* Estadísticas */}
          <div style={{ borderTop: '1px solid #f9fafb', paddingTop: 0, marginBottom: 24 }}>
            {partidoSeleccionado?.jugado ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb', border: '1px solid #f9fafb', borderRadius: 8, padding: '10px 14px', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#4b5563' }}>Tu predicción:</span>
                  {partidoSeleccionado?.prediccion ? (() => {
                    const color = colorPrediccion(partidoSeleccionado);
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, padding: '4px 10px', borderRadius: 6, background: color === '#16a34a' ? '#16a34a' : 'transparent', color: color === '#16a34a' ? '#fff' : color, border: `1px solid ${color}`, letterSpacing: 0.5 }}>
                          {partidoSeleccionado.prediccion.golesEquipoLocal} - {partidoSeleccionado.prediccion.golesEquipoVisitante}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 800, padding: '4px 10px', borderRadius: 6, background: color === '#16a34a' ? '#16a34a' : 'transparent', color: color === '#16a34a' ? '#fff' : color, border: `1px solid ${color}`, letterSpacing: 0.5 }}>
                          {calcularTextoPuntos(partidoSeleccionado)}
                        </div>
                      </div>
                    );
                  })() : (
                    <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500, fontStyle: 'italic' }}>No ingresaste predicción</span>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #e5e7eb', paddingBottom: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5 }}>Resultados del Grupo</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', background: '#f3f4f6', padding: '2px 8px', borderRadius: 12 }}>
                    {estadisticasPartido?.totalPredicciones ?? 0} predicciones
                  </span>
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
                    <div style={{ width: '100%', height: 8, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${pct ?? 0}%`, height: '100%', background: barColor ?? color, borderRadius: 4 }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5 }}>🔮 Tendencia de apuestas</span>
                {!estadisticasPartido ? (
                  <div style={{ height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 11, color: '#9ca3af', fontStyle: 'italic' }}>Cargando tendencias...</span>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', marginTop: 4 }}>
                      <div style={{ width: `${estadisticasPartido.porcentajes?.local ?? 34}%`, background: '#2563eb', transition: 'width 0.3s' }} title="Local" />
                      <div style={{ width: `${estadisticasPartido.porcentajes?.empate ?? 33}%`, background: '#d1d5db', transition: 'width 0.3s' }} title="Empate" />
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

          {/* Acciones */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              onClick={() => dialogRef.current?.close()}
              style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e5e7eb', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#374151', background: '#fff' }}
            >
              {modalBloqueado ? 'Cerrar' : 'Cancelar'}
            </button>
            {!modalBloqueado && (
              <button
                onClick={(e) => { e.stopPropagation(); handleGuardar(); }}
                style={{ padding: '8px 16px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
              >
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