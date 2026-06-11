import React, { useEffect, useState, useCallback } from 'react';
import { posicionesService } from '../api/posicionesService';
import type { Posicion } from '../api/posicionesService'

interface LeaderboardProps {
    pencaInstanciaId: number;
    refreshTrigger: number;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ pencaInstanciaId, refreshTrigger }) => {
    const [posiciones, setPosiciones] = useState<Posicion[]>([]);
    const [cargando, setCargando] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const slug = window.location.pathname.split('/')[1];

    const cargarPosiciones = useCallback(async () => {
        try {
            const data = await posicionesService.obtenerLeaderboard(slug, pencaInstanciaId);
            setPosiciones(data);
            setError(null);
        } catch (err) {
            console.error(err);
            setError("No se pudo cargar la tabla de posiciones.");
        } finally {
            setCargando(false);
        }
    }, [slug, pencaInstanciaId]);

    useEffect(() => {
        cargarPosiciones();
    }, [cargarPosiciones, refreshTrigger]);
    
    if (cargando) return <p style={{ textAlign: 'center', color: '#6b7280' }}>Cargando tabla de posiciones...</p>;
    if (error) return <p style={{ textAlign: 'center', color: '#ef4444' }}>{error}</p>;

    return (
        <div style={{ fontFamily: "'Barlow', sans-serif" }}>
            <div style={{ padding: '0' }}>
                {posiciones.length === 0 ? (
                    <p style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>Aún no hay participantes en esta penca.</p>
                ) : (
                    posiciones.map((participante) => (
                        <div 
                            key={participante.usuarioNombre} 
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '16px 20px',
                                borderBottom: '1px solid var(--border-color)',
                                backgroundColor: participante.esUsuarioActual ? 'var(--background-secondary, #f8f9fa)' : 'transparent',
                                borderRadius: participante.esUsuarioActual ? '6px' : '0'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <span style={{
                                    width: '30px',
                                    height: '30px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: participante.posicion <= 3 ? '#fbbf24' : '#f3f4f6',
                                    color: participante.posicion <= 3 ? '#ffffff' : '#6b7280',
                                    borderRadius: '50%',
                                    fontWeight: 700,
                                    fontSize: '14px'
                                }}>
                                    {participante.posicion}
                                </span>
                                
                                <span style={{ 
                                    fontWeight: participante.esUsuarioActual ? 700 : 500, 
                                    color: participante.esUsuarioActual ? 'var(--primary-color)' : 'var(--text-color)',
                                    fontSize: '15px'
                                }}>
                                    {participante.usuarioNombre}
                                    {participante.esUsuarioActual && " (Tú)"}
                                </span>
                            </div>

                            <div style={{ 
                                fontWeight: 800, 
                                color: 'var(--text-color)',
                                fontSize: '16px'
                            }}>
                                {participante.puntos} <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 600 }}>PTS</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Leaderboard;
