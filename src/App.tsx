import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
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

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <Router>
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
                  path="" 
                  element={user ? (
                    <div style={{ textAlign: 'center', marginTop: '50px' }}>
                      <h1>Bienvenido a la Plataforma de Pencas</h1>
                      <p>Hola, {user.nombre}. Ya estás autenticado en el sitio.</p>
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

        {/* Redirección por defecto si no hay slug (podría ser una landing page o error) */}
        <Route path="/" element={<Navigate to="/prueba-1/login" />} />
        
        {/* Fallback para rutas no encontradas */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
