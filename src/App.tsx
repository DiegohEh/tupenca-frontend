import { useEffect } from 'react';
import { Routes, Route, Navigate, useParams, useNavigate, Link } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import { useAuth } from './contexts/AuthContext';
import SlugGuard from './components/SlugGuard';
import './App.css';

/**
 * Componente auxiliar para manejar la redirección dinámica.
 * Extrae el 'slug' de la URL actual y redirige a la raíz de ese sitio.
 */
const SlugRedirect = () => {
  const { slug } = useParams();
  return <Navigate to={`/${slug}`} replace />;
};

/**
 * Componente temporal para la landing page de demostración.
 * Ahora incluye lógica de redirección inteligente usando useEffect para evitar
 * problemas con el doble renderizado de React 18 (Strict Mode).
 */
const LandingDemo = () => {
  const navigate = useNavigate();
  const lastSlug = localStorage.getItem('lastSlug');

  useEffect(() => {
    if (lastSlug) {
      // Limpiamos el slug y redirigimos fuera del renderizado principal
      localStorage.removeItem('lastSlug');
      navigate(`/${lastSlug}`, { replace: true });
    }
  }, [lastSlug, navigate]);

  // Si estamos redirigiendo, no mostramos nada o un cargando
  if (lastSlug) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
        <p>Volviendo al sitio...</p>
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
      fontFamily: 'Arial, sans-serif',
      color: '#333'
    }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>tupenca.uy</h1>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Plataforma en construcción, estamos preparando la cancha...
      </p>
      <div style={{ 
        padding: '8px 16px', 
        backgroundColor: '#f0f0f0', 
        borderRadius: '20px',
        fontSize: '14px',
        color: '#555'
      }}>
        Próximamente
      </div>
    </div>
  );
};

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <Routes>
      {/* Rutas con Slug del Sitio (Protegidas por SlugGuard) */}
      <Route 
        path="/:slug/*" 
        element={
          <SlugGuard>
            <Routes>
              <Route 
                path="login" 
                element={!user ? <Login /> : <SlugRedirect />} 
              />
              <Route 
                path="register" 
                element={!user ? <Register /> : <SlugRedirect />} 
              />
              <Route 
                path="profile" 
                element={user ? <Profile /> : <Navigate to="../login" />} 
              />
              <Route 
                path="" 
                element={user ? (
                  <div style={{ textAlign: 'center', marginTop: '50px' }}>
                    <h1>Bienvenido a la Plataforma de Pencas</h1>
                    <p>Hola, {user.nombre}. Ya estás autenticado en el sitio.</p>
                    <Link to="profile" style={{ display: 'inline-block', marginBottom: '20px', color: '#007bff' }}>
                      Ir a mi perfil
                    </Link>
                    <Login /> {/* Reutilizamos Login para mostrar el botón de cerrar sesión */}
                  </div>
                ) : (
                  <Navigate to="login" />
                )} 
              />
            </Routes>
          </SlugGuard>
        } 
      />

      {/* Redirección por defecto si no hay slug (landing page de demostración) */}
      <Route path="/" element={<LandingDemo />} />
      
      {/* Fallback para rutas no encontradas */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
