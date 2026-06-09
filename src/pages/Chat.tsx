import { useEffect, useState, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import { useAuth } from '../contexts/AuthContext';

interface ChatProps {
    participacionId: number;
}
interface Mensaje {
    usuarioId: number;
    nombre: string;
    contenido: string;
    fechaEnvio: string;
}

export default function Chat({participacionId} : ChatProps) {
    const [mensajes, setMensajes] = useState<Mensaje[]>([]);
    const [texto, setTexto] = useState('');
    const connectionRef = useRef<signalR.HubConnection | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [abierto, setAbierto] = useState(false);
    const { user } = useAuth();
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
  const pathParts = window.location.pathname.split('/');
  const slug = pathParts[1];
  const token = localStorage.getItem(`authToken_${slug}`) ?? '';

  const connection = new signalR.HubConnectionBuilder()
    .withUrl(`${import.meta.env.VITE_HUB_URL}/hubs/chat`, {
      accessTokenFactory: () => token
    })
    .withAutomaticReconnect()
    .build();

    if (!token || !participacionId) {
    console.warn('Chat sin token o participacionId inválido', { token: !!token, participacionId });
    return;
    }

  // Escuchar historial y mensajes nuevos
  connection.on('HistorialMensajes', (msgs: Mensaje[]) => {
    setMensajes(msgs);
  });
  connection.on('RecibirMensaje', (msg: Mensaje) => {
    setMensajes(prev => [...prev, msg]);
  });

  connection.start()
  .then(async () => {
    await connection.invoke('UnirseASala', participacionId);
    await connection.invoke('HistorialMensajes');
  })
  .catch(err => {
    console.error("Error al iniciar conexión:", err);
  });

  connectionRef.current = connection;
  return () => { connection.stop(); };
}, [participacionId]);
    useEffect(() => {
    if (abierto && messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
}, [abierto, mensajes]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [mensajes]);

const agruparPorDia = (mensajes: Mensaje[]) => {
  return mensajes.reduce((acc, msg) => {
    
    const fechaMsg = new Date(msg.fechaEnvio);
    const hoy = new Date();
    const ayer = new Date();
    ayer.setDate(hoy.getDate() - 1);

    const esHoy = fechaMsg.toDateString() === hoy.toDateString();
    const esAyer = fechaMsg.toDateString() === ayer.toDateString();

    const fecha = esHoy
      ? 'Hoy'
      : esAyer
      ? 'Ayer'
      : fechaMsg.toLocaleDateString('es-UY', { day: 'numeric', month: 'long', year: 'numeric' });


    if (!acc[fecha]) acc[fecha] = [];
    acc[fecha].push(msg);
    return acc;
  }, {} as Record<string, Mensaje[]>);
};

    const enviar = async () => {
        if (!texto.trim() || !connectionRef.current) return;

        try {
            await connectionRef.current.invoke('EnviarMensaje', texto.trim());
            setTexto('');
        } catch (err) {
            console.error('Error al enviar mensaje:', err);
        }
        };
return (
    <div style={{
        maxWidth: 420,
        borderRadius: 12,
        overflow: 'hidden',
        fontFamily: "'Barlow', sans-serif",
        background: '#fff',
        border: '1px solid #e5e7eb',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)'
    }}>
        {/* HEADER */}
        <div
            onClick={() => setAbierto(!abierto)}
            style={{
                padding: '10px 16px',
                cursor: 'pointer',
                background: '#fff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '2px solid #2563eb'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}></span>
                <span style={{ color: '#111827', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>Chat del grupo</span>
            </div>
            <span style={{ color: '#2563eb', fontSize: 11, fontWeight: 700 }}>{abierto ? '▲' : '▼'}</span>
        </div>

        {abierto && <>
            {/* MENSAJES */}
            <div
                ref={messagesContainerRef}
                style={{ height: 260, overflowY: 'auto', padding: '12px 16px', background: '#f9fafb' }}
            >
                {Object.entries(agruparPorDia(mensajes)).map(([fecha, msgs]) => (
                <div key={fecha}>
                    {/* Separador de fecha */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0 10px' }}>
                    <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>
                        {fecha}
                    </span>
                    <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
                    </div>

                    {/* Mensajes del día */}
                    {msgs.map((m, i) => {
                    const esMio = m.usuarioId === user?.id;
                    return (
                        <div key={i} style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: esMio ? 'flex-end' : 'flex-start',
                        marginBottom: 10
                        }}>
                        {!esMio && (
                            <span style={{ fontSize: 11, color: '#2563eb', marginBottom: 3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            {m.nombre}
                            </span>
                        )}
                        <div style={{
                            background: esMio ? '#2563eb' : '#fff',
                            color: esMio ? '#fff' : '#111827',
                            padding: '7px 12px',
                            borderRadius: esMio ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                            maxWidth: '75%',
                            fontSize: 13,
                            lineHeight: 1.4,
                            fontWeight: esMio ? 600 : 400,
                            border: esMio ? 'none' : '1px solid #e5e7eb'
                        }}>
                            {m.contenido}
                        </div>
                        <span style={{ fontSize: 10, color: '#9ca3af', marginTop: 3 }}>
                            {new Date(m.fechaEnvio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        </div>
                    );
                    })}
                </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* INPUT */}
            <div style={{
                display: 'flex',
                padding: '10px 12px',
                borderTop: '1px solid #e5e7eb',
                gap: 8,
                background: '#fff',
                alignItems: 'center'
            }}>
                <input
                    value={texto}
                    onChange={e => setTexto(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && enviar()}
                    placeholder="Escribí tu mensaje..."
                    style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: '1px solid #e5e7eb',
                        fontSize: 13,
                        outline: 'none',
                        background: '#f9fafb',
                        color: '#111827',
                        fontFamily: "'Barlow', sans-serif"
                    }}
                />
                <button
                    onClick={enviar}
                    style={{
                        background: '#2563eb',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '8px 14px',
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        flexShrink: 0,
                        fontFamily: "'Barlow', sans-serif"
                    }}
                >
                    Enviar
                </button>
            </div>
        </>}
    </div>
);
}