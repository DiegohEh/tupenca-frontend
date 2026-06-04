import React, { useState, useEffect } from 'react';
import { authService } from '../api/authService';

const AdminPencas: React.FC = () => {
  const [pencasAsociadas, setPencasAsociadas] = useState<any[]>([]);
  const [pencasSistema, setPencasSistema] = useState<any[]>([]);
  const [filtradas, setFiltradas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [pencaSeleccionada, setPencaSeleccionada] = useState<any>(null);
  const [costo, setCosto] = useState('');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => { fetchPencasAsociadas(); }, []);

  const fetchPencasAsociadas = async () => {
    try {
      const data = await authService.getPencas();
      setPencasAsociadas(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const abrirModal = async () => {
    setModalAbierto(true);
    try {
      const data = await authService.getPencasSistema();
      setPencasSistema(data);
      setFiltradas(data);
    } catch (err) { console.error(err); }
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setPencaSeleccionada(null);
    setCosto('');
    setBusqueda('');
  };

  const filtrar = (q: string) => {
    setBusqueda(q);
    setFiltradas(pencasSistema.filter(p => p.nombre.toLowerCase().includes(q.toLowerCase())));
  };

  const asociar = async () => {
    if (!pencaSeleccionada || !costo) return alert('Completá todos los campos');
    try {
      await authService.asociarPenca(Number(costo), pencaSeleccionada.id);
      cerrarModal();
      fetchPencasAsociadas();
    } catch (err) {
      console.error(err);
      alert('Error al asociar la penca');
    }
  };

  if (loading) return <div style={{ padding: 20 }}>Cargando...</div>;

  return (
    <div style={{ padding: '32px 40px', fontFamily: "'Barlow', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>Gestión de pencas</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>Pencas asociadas a tu sitio</p>
        </div>
        <button onClick={abrirModal} style={{ padding: '10px 18px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
          + Asociar penca
        </button>
      </div>

      {pencasAsociadas.length === 0 ? (
        <p style={{ color: '#9ca3af', textAlign: 'center', marginTop: 40 }}>No tenés pencas asociadas todavía.</p>
      ) : (
        pencasAsociadas.map((p: any) => (
          <div key={p.id} style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <p style={{ fontWeight: 600, fontSize: 15, margin: 0, color: '#111827' }}>{p.nombre}</p>
              <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>{p.cantidadEquipos} equipos · {p.modo}</p>
            </div>
          </div>
        ))
      )}

      {modalAbierto && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#ffffff', borderRadius: 16, padding: 28, width: 480, maxWidth: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>Asociar penca</h3>
              <button onClick={cerrarModal} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#6b7280' }}>✕</button>
            </div>

            <label style={{ fontSize: 13, color: '#6b7280', display: 'block', marginBottom: 6 }}>Buscá una penca del sistema</label>
            <input
              type="text"
              placeholder="Ej: Mundial, Champions..."
              value={busqueda}
              onChange={e => filtrar(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', marginBottom: 10, padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, outline: 'none' }}
            />

            <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, maxHeight: 180, overflowY: 'auto', marginBottom: 16 }}>
              {filtradas.length === 0 && (
                <p style={{ padding: 12, color: '#9ca3af', fontSize: 13, margin: 0 }}>Sin resultados</p>
              )}
              {filtradas.map((p: any) => (
                <div key={p.id} onClick={() => setPencaSeleccionada(p)}
                  style={{ padding: '10px 12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: pencaSeleccionada?.id === p.id ? '#eff6ff' : 'transparent', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ fontSize: 14, color: '#111827' }}>{p.nombre}</span>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>{p.cantidadEquipos} equipos</span>
                </div>
              ))}
            </div>

            {pencaSeleccionada && (
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '10px 12px', marginBottom: 16, fontSize: 13, color: '#1d4ed8' }}>
                ✓ {pencaSeleccionada.nombre}
              </div>
            )}

            <label style={{ fontSize: 13, color: '#6b7280', display: 'block', marginBottom: 6 }}>Costo de participación ($)</label>
            <input
              type="number"
              placeholder="Ej: 500"
              min="0"
              value={costo}
              onChange={e => setCosto(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', marginBottom: 24, padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, outline: 'none' }}
            />

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={cerrarModal} style={{ padding: '10px 18px', background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: '#374151' }}>
                Cancelar
              </button>
              <button onClick={asociar} style={{ padding: '10px 18px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                Asociar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPencas;