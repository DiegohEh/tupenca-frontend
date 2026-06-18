import React, { useEffect, useState, useCallback } from 'react';
import { posicionesService } from '../api/posicionesService';
import type { Posicion } from '../api/posicionesService'

interface LeaderboardProps {
    pencaInstanciaId: number;
    refreshTrigger: number;
    onCountChange?: (count: number) => void; // ← nuevo: para pasar el total al Dashboard
}

const Leaderboard: React.FC<LeaderboardProps> = ({ pencaInstanciaId, refreshTrigger, onCountChange }) => {
    const [posiciones, setPosiciones] = useState<Posicion[]>([]);
    const [cargando, setCargando] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const slug = window.location.pathname.split('/')[1];

    const cargarPosiciones = useCallback(async () => {
        try {
            const data = await posicionesService.obtenerLeaderboard(slug, pencaInstanciaId);
            setPosiciones(data);
            onCountChange?.(data.length); // ← notifica al Dashboard
            setError(null);
        } catch (err) {
            console.error(err);
            setError("No se pudo cargar la tabla de posiciones.");
        } finally {
            setCargando(false);
        }
    }, [slug, pencaInstanciaId, onCountChange]);

    useEffect(() => {
        cargarPosiciones();
    }, [cargarPosiciones, refreshTrigger]);

    if (cargando) return (
        <div style={{ padding: '20px 0' }}>
            {[...Array(5)].map((_, i) => (
                <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '14px 0',
                    borderBottom: '1px solid var(--border-color)',
                    opacity: 1 - i * 0.15,
                }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#f3f4f6' }} />
                    <div style={{ flex: 1, height: 14, borderRadius: 4, background: '#f3f4f6' }} />
                    <div style={{ width: 40, height: 14, borderRadius: 4, background: '#f3f4f6' }} />
                </div>
            ))}
        </div>
    );

    if (error) return <p style={{ textAlign: 'center', color: '#ef4444', fontSize: 13 }}>{error}</p>;

    return (
        <div style={{ fontFamily: 'var(--font-family)' }}>
            {posiciones.length === 0 ? (
                <p style={{ padding: '20px', textAlign: 'center', color: '#6b7280', fontSize: 13 }}>
                    Aún no hay participantes en esta penca.
                </p>
            ) : (
                posiciones.map((participante) => {
                    const esPodio = participante.posicion <= 3;
                    const medalColor = participante.posicion === 1
                        ? '#f59e0b'   // oro
                        : participante.posicion === 2
                        ? '#9ca3af'   // plata
                        : '#cd7c3f';  // bronce

                    return (
                        <div
                            key={participante.usuarioNombre}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '13px 12px',
                                borderRadius: 8,
                                marginBottom: 4,
                                backgroundColor: participante.esUsuarioActual
                                    ? 'color-mix(in srgb, var(--primary-color) 6%, transparent)'
                                    : 'transparent',
                                border: participante.esUsuarioActual
                                    ? '1px solid color-mix(in srgb, var(--primary-color) 20%, transparent)'
                                    : '1px solid transparent',
                                transition: 'background-color 0.2s',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                {/* Posición */}
                                <span style={{
                                    width: 28,
                                    height: 28,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: esPodio ? medalColor : '#f3f4f6',
                                    color: esPodio ? '#ffffff' : '#9ca3af',
                                    borderRadius: '50%',
                                    fontWeight: 700,
                                    fontSize: 12,
                                    flexShrink: 0,
                                }}>
                                    {esPodio ? ['🥇','🥈','🥉'][participante.posicion - 1] : participante.posicion}
                                </span>

                                {/* Nombre */}
                                <span style={{
                                    fontWeight: participante.esUsuarioActual ? 700 : 500,
                                    color: participante.esUsuarioActual ? 'var(--primary-color)' : 'var(--text-color)',
                                    fontSize: 14,
                                }}>
                                    {participante.usuarioNombre}
                                    {participante.esUsuarioActual && (
                                        <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500, marginLeft: 6 }}>
                                            (vos)
                                        </span>
                                    )}
                                </span>
                            </div>

                            {/* Puntos */}
                            <div style={{
                                fontWeight: 800,
                                color: 'var(--text-color)',
                                fontSize: 15,
                                display: 'flex',
                                alignItems: 'baseline',
                                gap: 3,
                            }}>
                                {participante.puntos}
                                <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>PTS</span>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
};

export default Leaderboard;