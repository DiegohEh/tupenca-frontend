import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSite } from '../contexts/SiteContext';
import { useAuth0 } from '@auth0/auth0-react';
import { Link, useParams } from 'react-router-dom';
import { TipoRegistro } from '../types';

/**
 * Página de Login híbrida: soporta credenciales locales y Google (Auth0).
 */
const Login: React.FC = () => {
  const { loginWithGoogle, user, login, logout, loading: authLoading } = useAuth();
  const { isAuthenticated } = useAuth0();
  const { site } = useSite();
  const { slug } = useParams<{ slug: string }>();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loadingLocal, setLoadingLocal] = useState(false);

  useEffect(() => {
    // Si isAuthenticated es true, estamos en la Llegada 1 (Auth0 nos reconoció, pero nuestro Backend aún no nos validó ni nos pateó).
    // Si intentamos mostrar el error ahora, se borraría antes del redirect.
    if (isAuthenticated) return;

    // Si isAuthenticated es false, estamos en la Llegada 2 (volvimos del logout de Auth0 limpios).
    const savedError = sessionStorage.getItem('google_auth_error');
    if (savedError) {
      setError(savedError);
      // Borramos con 100ms de retraso para sobrevivir al doble montaje del StrictMode de React 18
      setTimeout(() => {
        sessionStorage.removeItem('google_auth_error');
      }, 100);
    }
  }, [isAuthenticated]);

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

  // En login no mostramos el link de registro si está cerrado o si es solo con invitación
  const mostrarLinkRegistro = site && site.tipoRegistro !== TipoRegistro.Cerrada && site.tipoRegistro !== TipoRegistro.SoloConInvitacion;

  return (
    <div className="container-simple text-center">
      <h1 style={{ marginBottom: '5px' }}>{site?.nombre || 'tupenca.uy'}</h1>
      {site?.logoUrl && <img src={site.logoUrl} alt="Logo" style={{ maxWidth: '80px', marginBottom: '20px' }} />}
      
      {user ? (
        <div>
          <p className="mb-4">Bienvenido, <strong>{user.nombre}</strong>!</p>
          <p className="text-muted mb-4">Email: {user.email}</p>
          <button onClick={logout} className="btn-secondary" style={{ color: 'red', borderColor: 'red' }}>
            Cerrar Sesión
          </button>
        </div>
      ) : (
        <div>
          <p className="text-muted mb-4">Inicia sesión para jugar</p>
          
          {/* Formulario Tradicional */}
          <form onSubmit={handleLocalLogin} style={{ textAlign: 'left' }}>
            <div className="form-group">
              <input
                type="email"
                placeholder="Correo electrónico"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="password"
                placeholder="Contraseña"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p style={{ color: 'red', fontSize: '12px', marginTop: '-10px', marginBottom: '10px' }}>{error}</p>}
            <button 
              type="submit" 
              className="btn-primary"
              disabled={loadingLocal}
            >
              {loadingLocal ? 'Iniciando...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
            <hr style={{ flex: 1, borderColor: 'var(--border-color)', borderStyle: 'solid', borderWidth: '1px 0 0 0' }} />
            <span style={{ margin: '0 10px', color: '#888', fontSize: '12px' }}>O</span>
            <hr style={{ flex: 1, borderColor: 'var(--border-color)', borderStyle: 'solid', borderWidth: '1px 0 0 0' }} />
          </div>

          {/* Botón Google */}
          <button 
            onClick={() => loginWithGoogle(slug)}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#4285F4', borderColor: '#4285F4' }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962l3.007 2.332C4.672 5.164 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Google
          </button>

          {mostrarLinkRegistro ? (
            <div className="mt-4"> 
              <p style={{ fontSize: '14px' }}>
                ¿No tienes cuenta? <Link to={`/${slug}/register`} style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>Regístrate</Link>
              </p>
              {site?.tipoRegistro === TipoRegistro.AbiertaConAutorizacion && (
                <p className="text-muted" style={{ fontSize: '12px', marginTop: '5px' }}>
                  El registro quedará pendiente de aprobación.
                </p>
              )}
            </div>
          ) : site?.tipoRegistro === TipoRegistro.SoloConInvitacion ? (
            <p className="text-muted mt-4" style={{ fontSize: '14px' }}>
              Este sitio es solo con invitación.
            </p>
          ) : (
            <p className="text-muted mt-4" style={{ fontSize: '14px' }}>
              Los registros están cerrados para este sitio.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Login;
