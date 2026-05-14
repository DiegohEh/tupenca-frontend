import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSite } from '../contexts/SiteContext';
import { useNavigate, Link, useParams, Navigate } from 'react-router-dom';
import { TipoRegistro } from '../types';

const Register: React.FC = () => {
  const { register } = useAuth();
  const { site } = useSite();
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Si los registros están cerrados, redirigimos al login
  if (site && site.tipoRegistro === TipoRegistro.Cerrada) {
    return <Navigate to={`/${slug}/login`} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register({
        nombre,
        email,
        password,
        sitioId: 0 // Se usará el slug en su lugar
      }, slug);
      navigate(`/${slug}`);
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Error al registrar el usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '80vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1>Crear Cuenta en {site?.nombre || slug}</h1>
      <p>Regístrate para empezar a jugar</p>

      <form onSubmit={handleSubmit} style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        width: '300px',
        marginTop: '20px'
      }}>
        <input
          type="text"
          placeholder="Nombre completo"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
        />
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
        />
        
        {error && <p style={{ color: 'red', fontSize: '14px', margin: 0 }}>{error}</p>}

        <button 
          type="submit" 
          disabled={loading}
          style={{
            padding: '10px',
            backgroundColor: site?.colorPrincipal || '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px'
          }}
        >
          {loading ? 'Registrando...' : 'Registrarse'}
        </button>
      </form>

      <p style={{ marginTop: '20px' }}>
        ¿Ya tienes cuenta? <Link to={`/${slug}/login`} style={{ color: '#4285F4', textDecoration: 'none' }}>Inicia sesión</Link>
      </p>
    </div>
  );
};

export default Register;
