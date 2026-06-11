import React, { useEffect, useState, useCallback } from 'react';
import { partidosService } from '../api/partidosService';
import type { PartidoAPI } from '../api/partidosService';

interface PartidosProps {
    slug: string;
    pencaInstanciaId: number;
    refreshTrigger: number;
}

const Partidos: React.FC<PartidosProps> = ({ slug, pencaInstanciaId, refreshTrigger }) => {
    const [partidos, setPartidos] = useState<PartidoAPI[]>([]);
    const [cargando, setCargando] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

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

    // Recargar datos cuando cambie el refreshTrigger o al montar
    useEffect(() => {
        cargarPartidos();
    }, [cargarPartidos, refreshTrigger]);

    if (cargando) return <p style={{ textAlign: 'center', color: '#6b7280' }}>Cargando partidos...</p>;
    if (error) return <p style={{ textAlign: 'center', color: '#ef4444' }}>{error}</p>;

    if (partidos.length === 0) {
        return <p style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>No hay partidos programados para esta penca.</p>;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {partidos.map((partido) => {
                // Formateo de fecha
                const fecha = new Date(partido.fecha);
                const fechaStr = fecha.toLocaleDateString('es-UY', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

                return (
                    <div key={partido.id} style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '10px',
                        padding: '16px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>
                            <span>{fechaStr}</span>
                            {partido.jugado ? (
                                <span style={{ backgroundColor: '#f3f4f6', padding: '2px 8px', borderRadius: '12px' }}>Finalizado</span>
                            ) : (
                                <span style={{ backgroundColor: '#ecfdf5', color: '#059669', padding: '2px 8px', borderRadius: '12px' }}>Próximo</span>
                            )}
                        </div>

                        {/* Equipos y Resultado */}
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

                        {/* Predicción del usuario */}
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
                                <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Sin predicción cargada</span>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default Partidos;
