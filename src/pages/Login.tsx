import React from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Página de Login simple para demostrar la integración con Auth0.
 */
const Login: React.FC = () => {
  const { loginWithGoogle, user, logout, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
        <p>Cargando sesión...</p>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '80vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1>tupenca.uy</h1>
      
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
        <div style={{ textAlign: 'center' }}>
          <p>Para comenzar a apostar, inicia sesión.</p>
          <button 
            onClick={loginWithGoogle}
            style={{
              padding: '12px 24px',
              backgroundColor: '#4285F4',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              fontSize: '16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginTop: '20px'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962l3.007 2.332C4.672 5.164 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Iniciar sesión con Google
          </button>
        </div>
      )}
    </div>
  );
};

export default Login;
