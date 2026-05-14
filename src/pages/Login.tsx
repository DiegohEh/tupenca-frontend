import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSite } from '../contexts/SiteContext';
import { Link, useParams } from 'react-router-dom';
import { TipoRegistro } from '../types';

/**
 * Página de Login híbrida: soporta credenciales locales y Google (Auth0).
 */
const Login: React.FC = () => {
  const { loginWithGoogle, user, login, logout, loading: authLoading } = useAuth();
  const { site } = useSite();
  const { slug } = useParams<{ slug: string }>();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loadingLocal, setLoadingLocal] = useState(false);

  const handleLocalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoadingLocal(true);
    try {
      await login({ email, password }, slug);
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Credenciales incorrectas');
    } finally {
      setLoadingLocal(false);
    }
  };

  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
        <p>Cargando sesión...</p>
      </div>
    );
  }

  // Determinamos si el registro está permitido en este sitio
  const registroPermitido = site && site.tipoRegistro !== TipoRegistro.Cerrada;

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '80vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1>{site?.nombre || 'tupenca.uy'}</h1>
      {site?.logoUrl && <img src={site.logoUrl} alt="Logo" style={{ maxWidth: '100px', marginBottom: '20px' }} />}
      
      {user ? (
        <div style={{ textAlign: 'center' }}>
          <p>Bienvenido, <strong>{user.nombre}</strong>!</p>
          <p>Email: {user.email}</p>
          <button 
            onClick={logout}
            style={{
              padding: '10px 20px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              marginTop: '20px'
            }}
          >
            Cerrar Sesión
          </button>
        </div>
      ) : (
        <div style={{ textAlign: 'center', width: '300px' }}>
          <p>Inicia sesión para jugar</p>
          
          {/* Formulario Tradicional */}
          <form onSubmit={handleLocalLogin} style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            marginBottom: '20px'
          }}>
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
            {error && <p style={{ color: 'red', fontSize: '12px', margin: 0 }}>{error}</p>}
            <button 
              type="submit" 
              disabled={loadingLocal}
              style={{
                padding: '10px',
                backgroundColor: site?.colorPrincipal || '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: loadingLocal ? 'not-allowed' : 'pointer'
              }}
            >
              {loadingLocal ? 'Iniciando...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
            <hr style={{ flex: 1 }} />
            <span style={{ margin: '0 10px', color: '#888', fontSize: '12px' }}>O</span>
            <hr style={{ flex: 1 }} />
          </div>

          {/* Botón Google */}
          <button 
            onClick={() => loginWithGoogle(slug)}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: 'rgba(66, 134, 244, 0)',
              color: '#4285F4',
              fontWeight: 'bold',
              border: '1px solid #4285F4',
              borderRadius: '5px',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962l3.007 2.332C4.672 5.164 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
          </button>

          {registroPermitido ? (
            <p style={{ marginTop: '20px', fontSize: '14px' }}>
              ¿No tienes cuenta? <Link to={`/${slug}/register`} style={{ color: '#4285F4', textDecoration: 'none' }}>Regístrate</Link>
            </p>
          ) : (
            <p style={{ marginTop: '20px', fontSize: '14px', color: '#888' }}>
              Los registros están cerrados para este sitio.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Login;
