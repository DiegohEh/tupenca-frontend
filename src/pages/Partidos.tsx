import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { authService } from '../api/authService';
import { useAuth } from '../contexts/AuthContext';


const Partidos = () => {

  const { idParticipacion, idPenca } = useParams();
  
  const [partidos, setPartidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [golesLocal, setGolesLocal] = useState('');
  const [golesVisitante, setGolesVisitante] = useState('');
  const [partidoSeleccionado, setPartidoSeleccionado] = useState<any>(null);

  const dialogRef = useRef<HTMLDialogElement>(null);

  const { user } = useAuth();
  const userId = user?.id;
  const navigate = useNavigate();

  const thStyle: React.CSSProperties = {
    padding: '10px',
    textAlign: 'left',
    borderBottom: '2px solid #ddd',
  };

  const tdStyle: React.CSSProperties = {
    padding: '10px',
  };

  const abrirModal = (partido: any) => {
    setPartidoSeleccionado(partido);
    setGolesLocal(partido.prediccion.golesEquipoLocal ?? '');
    setGolesVisitante(partido.prediccion.golesEquipoVisitante ??'');
    dialogRef.current?.showModal();
  };

  const handleGuardar = async () => {
    await authService.realizarPrediccion(
        Number(partidoSeleccionado.prediccion.id),
        Number(golesLocal),
        Number(golesVisitante),
        Number(idParticipacion),
        partidoSeleccionado.id,
        4);
    dialogRef.current?.close();
    await fetchPartidos(); // 👈 recarga los partidos

  };

  const fetchPartidos = async () => {
      const participacionId = Number(idParticipacion);
      const pencaId = Number(idPenca);
      try {
        const data = await authService.getPartidosPenca(Number(participacionId), Number(pencaId));
        setPartidos(data);
      } catch (err: any) {
        setError(err.response?.data?.mensaje || 'Error cargando partidos');
      } finally {
        setLoading(false);
      }
  }

  useEffect(() => {
    if (idParticipacion && idPenca) fetchPartidos();
  }, [idParticipacion, idPenca]);

  return (    
    <div style={{ padding: "20px" }}>
      <h2>Partidos</h2>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f2f2f2" }}>
            <th style={thStyle}>ID</th>
            <th style={thStyle}>Equipo Local</th>
            <th style={thStyle}>Equipo Visitante</th>
            <th style={thStyle}>Fecha y hora inicio</th>
            <th style={thStyle}>Resultado</th>
            <th style={thStyle}>Prediccion</th>
            <th style={thStyle}>Puntos</th>
            <th style={thStyle}></th>
          </tr>
        </thead>

        <tbody>
          {partidos.map((partido) => (
            <tr key={partido.id} style={{ borderBottom: "1px solid #ddd" }}>
              <td style={tdStyle}>{partido.id}</td>
              <td style={tdStyle}>{partido.local.nombre}</td>
              <td style={tdStyle}>{partido.visitante.nombre}</td>
              <td style={tdStyle}>{partido.fecha}</td>
              <td style={tdStyle}>{partido.golesLocal} - {partido.golesVisitante}</td>
              <td style={tdStyle}>
                {partido.prediccion
                  ? <span>{partido.prediccion.golesEquipoLocal} - {partido.prediccion.golesEquipoVisitante}</span>
                  : <span>Sin prediccion</span>
                }
              </td>
              <td style={tdStyle}>{partido.prediccion.puntosObtenidos}</td>
              <td style={tdStyle}> 
                <button
                  type = "button"
                  disabled = {partido.jugado}
                  style={{
                    padding: '12px',
                    border: 'none',
                    borderRadius: '10px',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    cursor: partido.jugado ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold',
                  }}
                  onClick={() => abrirModal(partido)}
                >
                  Mi prediccion
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

<dialog ref={dialogRef} style={{ borderRadius: 8, padding: 24, border: '1px solid #ddd', minWidth: 260 }}>
  <p>Partido {partidoSeleccionado?.id}</p>
  <div style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '12px 0' }}>
    
    {/* Goles Local */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <button onClick={() => setGolesLocal(v => String(Math.max(0, Number(v) - 1)))}
              style={{ width: 28, height: 28, cursor: 'pointer' }}>−</button>
      <span style={{ width: 24, textAlign: 'center', fontWeight: 'bold' }}>{golesLocal}</span>
      <button onClick={() => setGolesLocal(v => String(Number(v) + 1))}
              style={{ width: 28, height: 28, cursor: 'pointer' }}>+</button>
    </div>

    <span>-</span>

    {/* Goles Visitante */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <button onClick={() => setGolesVisitante(v => String(Math.max(0, Number(v) - 1)))}
              style={{ width: 28, height: 28, cursor: 'pointer' }}>−</button>
      <span style={{ width: 24, textAlign: 'center', fontWeight: 'bold' }}>{golesVisitante}</span>
      <button onClick={() => setGolesVisitante(v => String(Number(v) + 1))}
              style={{ width: 28, height: 28, cursor: 'pointer' }}>+</button>
    </div>

  </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={() => dialogRef.current?.close()}>Cancelar</button>
          <button onClick={handleGuardar} 
          style={{ padding: '6px 14px', 
          backgroundColor: '#2563eb', 
          color: 'white', 
          border: 'none', 
          borderRadius: 6,
           cursor: 'pointer' }}>
            Guardar
            </button>
        </div>
      </dialog>
    </div>
  );
};

export default Partidos;