import React, { useState, useCallback, useEffect, useRef } from 'react';
import { partidosService } from '../api/partidosService';
import { prediccionService } from '../api/prediccionService';
import type { PartidoAPI } from '../api/partidosService';

const FECHAS_POR_PAGINA = 3;

interface PartidosProps {
    slug: string;
    pencaInstanciaId: number;
    participacionId: number;
    refreshTrigger: number;
}

const Partidos: React.FC<PartidosProps> = ({ slug, pencaInstanciaId, participacionId, refreshTrigger }) => {
    const [partidos, setPartidos] = useState<PartidoAPI[]>([]);
    const [cargando, setCargando] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [tab, setTab] = useState<'apostables' | 'finalizados'>('apostables');
    const [partidoSeleccionado, setPartidoSeleccionado] = useState<any>(null);
    const [golesLocal, setGolesLocal] = useState('0');
    const [golesVisitante, setGolesVisitante] = useState('0');
    const [estadisticasPartido, setEstadisticasPartido] = useState<any>(null);
    const [pagina, setPagina] = useState(0);
    const [cambiandoPagina, setCambiandoPagina] = useState(false);
    const dialogRef = useRef<HTMLDialogElement>(null);
    const tabsRef = useRef<HTMLDivElement>(null);
    const pagingTimeoutRef = useRef<number | null>(null);

    const apostables = partidos.filter(p => !p.jugado);
    const finalizados = partidos.filter(p => p.jugado);

    const modalBloqueado =
        partidoSeleccionado?.jugado ||
        new Date((partidoSeleccionado?.fecha ?? '') + 'Z') <= new Date();

    const cargarPartidos = useCallback(async () => {
        try {
            const data = await partidosService.getPartidos(slug, pencaInstanciaId);
            setPartidos(data);
            setError(null);
        } catch (err) {
            console.error(err);
            setError("No se pudieron cargar los partidos.");
        } finally {
            setCargando(false);
        }
    }, [slug, pencaInstanciaId]);

    useEffect(() => {
        cargarPartidos();
    }, [cargarPartidos, refreshTrigger]);

    useEffect(() => {
        setPagina(0);
    }, [tab, refreshTrigger]);

    useEffect(() => {
        return () => {
            if (pagingTimeoutRef.current !== null) {
                window.clearTimeout(pagingTimeoutRef.current);
            }
        };
    }, []);

    const agruparPorFecha = (lista: PartidoAPI[], descendente = false) => {
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
        }, new Map<string, PartidoAPI[]>());
    };

    const partidosTab = tab === 'apostables' ? apostables : finalizados;
    const gruposFecha = [...agruparPorFecha(partidosTab, tab === 'finalizados')];
    const totalPaginas = Math.max(1, Math.ceil(gruposFecha.length / FECHAS_POR_PAGINA));
    const gruposPagina = gruposFecha.slice(pagina * FECHAS_POR_PAGINA, (pagina + 1) * FECHAS_POR_PAGINA);

    const obtenerTendencia = async (partidoId: number) => {
        try {
            const data = await prediccionService.tendenciaPredicciones(partidoId);
            setEstadisticasPartido(data);
        } catch (err) {
            console.error(err);
            setEstadisticasPartido(null);
        }
    };

    const obtenerEstadisticas = async (partidoId: number) => {
        try {
            const data = await prediccionService.resultadosPredicciones(partidoId);
            setEstadisticasPartido(data ?? null);
        } catch (err) {
            console.error(err);
            setEstadisticasPartido(null);
        }
    };

    const abrirModal = async (partido: any) => {
        setPartidoSeleccionado(partido);
        setEstadisticasPartido(null);
        setGolesLocal(partido.prediccion?.golesEquipoLocal ?? '0');
        setGolesVisitante(partido.prediccion?.golesEquipoVisitante ?? '0');

        if (partido.jugado) {
            await obtenerEstadisticas(partido.id);
        } else {
            await obtenerTendencia(partido.id);
        }

        dialogRef.current?.showModal();
    };

    const handleGuardar = async () => {
        if (!participacionId) return;
        try {
            await prediccionService.realizarPrediccion(
                Number(partidoSeleccionado.prediccion?.id ?? 0),
                Number(golesLocal),
                Number(golesVisitante),
                participacionId,
                partidoSeleccionado.id
            );
            setPartidos(prev =>
                prev.map(p => {
                    if (p.id !== partidoSeleccionado.id) return p;
                    return {
                        ...p,
                        prediccion: {
                            id: p.prediccion?.id ?? 0,
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
            const mensajeBackend =
                error?.response?.data?.mensaje ??
                error?.response?.data?.message ??
                error?.response?.data ??
                'Error al guardar la predicción.';

            alert(typeof mensajeBackend === 'string' ? mensajeBackend : 'Error al guardar la predicción.');
        }
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

    const calcularTextoPuntos = (partido: any) => {
        if (!partido.jugado || !partido.prediccion) return '0 PTS';
        const { golesEquipoLocal: pL, golesEquipoVisitante: pV } = partido.prediccion;
        const { golesLocal: rL, golesVisitante: rV } = partido;
        if (pL === rL && pV === rV) return 'Resultado Exacto +10';
        if (partido.prediccion.puntosObtenidos === 5) return 'Acierto +5 PTS';
        return '+0 PTS';
    };

    const cambiarPagina = (nuevaPagina: number) => {
        if (nuevaPagina === pagina) return;
        if (pagingTimeoutRef.current !== null) {
            window.clearTimeout(pagingTimeoutRef.current);
        }

        setCambiandoPagina(true);
        pagingTimeoutRef.current = window.setTimeout(() => {
        setPagina(nuevaPagina);
        tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            window.setTimeout(() => setCambiandoPagina(false), 120);
        }, 70);
    };

    if (cargando) return <p style={{ textAlign: 'center', color: '#6b7280' }}>Cargando partidos...</p>;
    if (error) return <p style={{ textAlign: 'center', color: '#ef4444' }}>{error}</p>;
    if (partidos.length === 0) return <p style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>No hay partidos programados para esta penca.</p>;

    return (
        <div>
            <style>{`
                @keyframes partidos-tab-enter {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes partidos-page-enter {
                    from {
                        opacity: 0;
                        transform: translateY(8px) scale(0.995);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
            `}</style>

            {/* TABS */}
            <div ref={tabsRef} style={{ display: 'flex', gap: 4, borderBottom: '1px solid #e5e7eb', marginBottom: 24 }}>
                {(['apostables', 'finalizados'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)} style={{
                        padding: '10px 20px', border: 'none', background: 'transparent', cursor: 'pointer',
                        fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1,
                        color: tab === t ? 'var(--primary-color)' : '#9ca3af',
                        borderBottom: tab === t ? '2px solid var(--primary-color)' : '2px solid transparent',
                        marginBottom: -1,
                    }}>
                        {t === 'apostables' ? 'Próximos' : 'Finalizados'}
                    </button>
                ))}
            </div>

            {/* CONTENIDO */}
            {tab === 'finalizados' && finalizados.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
                    <p style={{ fontWeight: 700, color: '#6b7280' }}>Aún no hay partidos finalizados</p>
                </div>
            ) : tab === 'apostables' && apostables.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
                    <p style={{ fontWeight: 700, color: '#6b7280' }}>No quedan partidos por jugar</p>
                </div>
            ) : (
                <>
                    <div
                        key={`${tab}-${pagina}`}
                        style={{
                            transition: 'opacity 0.18s ease, transform 0.18s ease',
                            opacity: cambiandoPagina ? 0.55 : 1,
                            transform: cambiandoPagina ? 'translateY(4px)' : 'translateY(0)',
                            animation: 'partidos-tab-enter 220ms ease both',
                            willChange: 'opacity, transform',
                        }}
                    >
                    {gruposPagina.map(([fecha, ps]: [string, PartidoAPI[]]) => (
                    <div key={fecha} style={{ marginBottom: 28 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--primary-color)', whiteSpace: 'nowrap' }}>
                                {fecha}
                            </span>
                            <div style={{ flex: 1, height: 1, background: 'color-mix(in srgb, var(--primary-color) 18%, #e5e7eb)' }} />
                        </div>

                        <div className="partidos-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12, width: '100%' }}>
                            {(ps as PartidoAPI[]).map((partido, index) => {
                                const empezado = new Date(partido.fecha + 'Z') <= new Date();
                                const bloqueado = partido.jugado || empezado;
                                const fecha = new Date(partido.fecha + 'Z');
                                const esUltimoImpar = ps.length % 2 === 1 && index === ps.length - 1;

                                const fechaStr = fecha.toLocaleDateString('es-UY', { weekday: 'short', day: '2-digit', month: 'short' })
    + ', ' + fecha.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit', hour12: false });

                                return (
                                    <div
                                        key={partido.id}
                                        onClick={() => abrirModal(partido)}
                                        style={{
                                            gridColumn: esUltimoImpar ? '1 / -1' : 'auto',
                                            backgroundColor: '#ffffff',
                                            border: empezado ? '1px solid #16a34a33' : '1px solid #e5e7eb',
                                            borderRadius: '10px',
                                            padding: '16px',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '10px',
                                            cursor: bloqueado ? 'default' : 'pointer',
                                            minWidth: 0,
                                        }}
                                    >
                                        {/* Header */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>
                                            <span>{fechaStr}</span>
                                            {partido.jugado ? (
                                                <span style={{ backgroundColor: '#f3f4f6', padding: '2px 8px', borderRadius: '12px' }}>Finalizado</span>
                                            ) : empezado ? (
                                                <span style={{ backgroundColor: '#ecfdf5', color: '#059669', padding: '2px 8px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
                                                    EN JUEGO
                                                </span>
                                            ) : (
                                                <span style={{ backgroundColor: '#ecfdf5', color: '#059669', padding: '2px 8px', borderRadius: '12px' }}>Próximo</span>
                                            )}
                                        </div>

                                        {/* Equipos */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', margin: '10px 0' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                                                <img src={partido.local.logoUrl} alt={partido.local.nombre} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '50%', border: '1px solid #e5e7eb', marginBottom: '8px' }} />
                                                <span style={{ fontWeight: 600, color: '#1f2937', textAlign: 'center' }}>{partido.local.nombre}</span>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '24px', fontWeight: 800, color: '#111827' }}>
                                                <span>{partido.jugado ? partido.golesLocal : '-'}</span>
                                                <span style={{ color: '#9ca3af', fontSize: '18px' }}>vs</span>
                                                <span>{partido.jugado ? partido.golesVisitante : '-'}</span>
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                                                <img src={partido.visitante.logoUrl} alt={partido.visitante.nombre} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '50%', border: '1px solid #e5e7eb', marginBottom: '8px' }} />
                                                <span style={{ fontWeight: 600, color: '#1f2937', textAlign: 'center' }}>{partido.visitante.nombre}</span>
                                            </div>
                                        </div>

                                        {/* Predicción */}
                                        <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                                            {partido.prediccion ? (
                                                <>
                                                    <span style={{ color: '#4b5563' }}>Tu predicción: <b>{partido.prediccion.golesEquipoLocal} - {partido.prediccion.golesEquipoVisitante}</b></span>
                                                    {partido.jugado && (
                                                        <span style={{ fontWeight: 700, color: partido.prediccion.puntosObtenidos > 0 ? '#10b981' : '#ef4444' }}>
                                                            +{partido.prediccion.puntosObtenidos} pts
                                                        </span>
                                                    )}
                                                </>
                                            ) : (
                                                <span style={{ color: bloqueado ? '#9ca3af' : '#2563eb', fontStyle: bloqueado ? 'italic' : 'normal', fontWeight: bloqueado ? 400 : 600 }}>
                                                    {bloqueado ? 'Sin predicción cargada' : '⊕ PRONOSTICAR'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    ))}
                    </div>

                    {totalPaginas > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 16, padding: '16px 12px 0', borderTop: '1px solid #e5e7eb', flexWrap: 'wrap', animation: 'partidos-page-enter 220ms ease both' }}>
                        <button
                            disabled={pagina === 0}
                            onClick={() => cambiarPagina(pagina - 1)}
                            style={{
                                padding: '8px 14px',
                                borderRadius: 999,
                                border: '1px solid #e5e7eb',
                                background: pagina === 0 ? '#f9fafb' : '#fff',
                                color: pagina === 0 ? '#d1d5db' : '#111827',
                                cursor: pagina === 0 ? 'not-allowed' : 'pointer',
                                fontSize: 13,
                                fontWeight: 700,
                                minWidth: 96,
                                boxShadow: pagina === 0 ? 'none' : '0 1px 3px rgba(0,0,0,0.06)',
                            }}
                        >
                            ← Anterior
                        </button>

                        <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 700, minWidth: 92, textAlign: 'center', padding: '6px 10px', borderRadius: 999, background: '#f8fafc', border: '1px solid #e5e7eb' }}>
                            {pagina + 1} de {totalPaginas}
                        </span>

                        <button
                            disabled={pagina >= totalPaginas - 1}
                            onClick={() => cambiarPagina(pagina + 1)}
                            style={{
                                padding: '8px 14px',
                                borderRadius: 999,
                                border: '1px solid #e5e7eb',
                                background: pagina >= totalPaginas - 1 ? '#f9fafb' : '#fff',
                                color: pagina >= totalPaginas - 1 ? '#d1d5db' : '#111827',
                                cursor: pagina >= totalPaginas - 1 ? 'not-allowed' : 'pointer',
                                fontSize: 13,
                                fontWeight: 700,
                                minWidth: 96,
                                boxShadow: pagina >= totalPaginas - 1 ? 'none' : '0 1px 3px rgba(0,0,0,0.06)',
                            }}
                        >
                            Siguiente →
                        </button>
                    </div>
                    )}
                </>
            )}

            {/* MODAL */}
            <dialog ref={dialogRef} style={{
                borderRadius: 12, padding: 28, border: '1px solid #e5e7eb', minWidth: 360, maxWidth: 420,
                position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', margin: 0,
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            }}>
                {/* Equipos en modal */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 24 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
                        <img src={partidoSeleccionado?.local?.logoUrl} alt={partidoSeleccionado?.local?.nombre} style={{ width: 58, height: 58, objectFit: 'contain', borderRadius: 8, background: '#f3f4f6', padding: 4 }} />
                        <span style={{ fontWeight: 700, fontSize: 14, color: '#111827', textAlign: 'center' }}>{partidoSeleccionado?.local?.nombre}</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>vs</span>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
                        <img src={partidoSeleccionado?.visitante?.logoUrl} alt={partidoSeleccionado?.visitante?.nombre} style={{ width: 58, height: 58, objectFit: 'contain', borderRadius: 8, background: '#f3f4f6', padding: 4 }} />
                        <span style={{ fontWeight: 700, fontSize: 14, color: '#111827', textAlign: 'center' }}>{partidoSeleccionado?.visitante?.nombre}</span>
                    </div>
                </div>

                {/* Goles */}
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button disabled={modalBloqueado} onClick={() => setGolesLocal(v => String(Math.max(0, Number(v) - 1)))}
                            style={{ width: 34, height: 34, cursor: modalBloqueado ? 'not-allowed' : 'pointer', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 18, opacity: modalBloqueado ? 0.5 : 1 }}>−</button>
                        <span style={{ width: 36, textAlign: 'center', fontWeight: 800, fontSize: 30, color: '#111827' }}>
                            {modalBloqueado ? (partidoSeleccionado?.jugado ? partidoSeleccionado?.golesLocal : golesLocal) : golesLocal}
                        </span>
                        <button disabled={modalBloqueado} onClick={() => setGolesLocal(v => String(Number(v) + 1))}
                            style={{ width: 34, height: 34, cursor: modalBloqueado ? 'not-allowed' : 'pointer', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 18, opacity: modalBloqueado ? 0.5 : 1 }}>+</button>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 26, color: '#d1d5db' }}>-</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button disabled={modalBloqueado} onClick={() => setGolesVisitante(v => String(Math.max(0, Number(v) - 1)))}
                            style={{ width: 34, height: 34, cursor: modalBloqueado ? 'not-allowed' : 'pointer', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 18, opacity: modalBloqueado ? 0.5 : 1 }}>−</button>
                        <span style={{ width: 36, textAlign: 'center', fontWeight: 800, fontSize: 30, color: '#111827' }}>
                            {modalBloqueado ? (partidoSeleccionado?.jugado ? partidoSeleccionado?.golesVisitante : golesVisitante) : golesVisitante}
                        </span>
                        <button disabled={modalBloqueado} onClick={() => setGolesVisitante(v => String(Number(v) + 1))}
                            style={{ width: 34, height: 34, cursor: modalBloqueado ? 'not-allowed' : 'pointer', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 18, opacity: modalBloqueado ? 0.5 : 1 }}>+</button>
                    </div>
                </div>

                {/* Estadísticas / Tendencias */}
                <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 16, marginBottom: 20 }}>
                    {partidoSeleccionado?.jugado ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb', borderRadius: 8, padding: '10px 14px', marginBottom: 10 }}>
                                <span style={{ fontSize: 12, fontWeight: 600, color: '#4b5563' }}>Tu predicción:</span>
                                {partidoSeleccionado?.prediccion ? (() => {
                                    const color = colorPrediccion(partidoSeleccionado) ?? '#dc2626';
                                    return (
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <div style={{ fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 6, background: color === '#16a34a' ? '#16a34a' : 'transparent', color: color === '#16a34a' ? '#fff' : color, border: `1px solid ${color}` }}>
                                                {partidoSeleccionado.prediccion.golesEquipoLocal} - {partidoSeleccionado.prediccion.golesEquipoVisitante}
                                            </div>
                                            <div style={{ fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 6, background: color === '#16a34a' ? '#16a34a' : 'transparent', color: color === '#16a34a' ? '#fff' : color, border: `1px solid ${color}` }}>
                                                {calcularTextoPuntos(partidoSeleccionado)}
                                            </div>
                                        </div>
                                    );
                                })() : (
                                    <span style={{ fontSize: 11, color: '#9ca3af', fontStyle: 'italic' }}>No ingresaste predicción</span>
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
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                                        <div>
                                            <span style={{ fontWeight: 600, color: '#4b5563' }}>{label} </span>
                                            <span style={{ fontSize: 11, color: '#9ca3af' }}>({cant ?? 0} personas)</span>
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
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5 }}>Tendencia de apuestas</span>
                            {!estadisticasPartido ? (
                                <span style={{ fontSize: 11, color: '#9ca3af', fontStyle: 'italic' }}>Cargando tendencias...</span>
                            ) : (
                                <>
                                    <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', marginTop: 4 }}>
                                        <div style={{ width: `${estadisticasPartido.porcentajes?.local ?? 34}%`, background: '#2563eb' }} />
                                        <div style={{ width: `${estadisticasPartido.porcentajes?.empate ?? 33}%`, background: '#d1d5db' }} />
                                        <div style={{ width: `${estadisticasPartido.porcentajes?.visitante ?? 33}%`, background: '#ef4444' }} />
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
                    <button onClick={() => dialogRef.current?.close()}
                        style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e5e7eb', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#374151', background: '#fff' }}>
                        {modalBloqueado ? 'Cerrar' : 'Cancelar'}
                    </button>
                    {!modalBloqueado && (
                        <button onClick={handleGuardar}
                            style={{ padding: '8px 16px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                            Guardar Predicción
                        </button>
                    )}
                </div>
            </dialog>
        </div>
    );
};

export default Partidos;