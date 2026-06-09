import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Partidos from './pages/Partidos';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import AdminPencas from './pages/AdminPencas';
import CheckoutPenca from './pages/CheckoutPenca';
import AuthenticatedLayout from './components/AuthenticatedLayout';
import { useAuth } from './contexts/AuthContext';
import SlugGuard from './components/SlugGuard';
import AdminLayout from './components/AdminLayout';
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
 * Componente auxiliar para redirigir al login usando el slug actual.
 */
const LoginRedirect = () => {
  const { slug } = useParams();
  return <Navigate to={`/${slug}/login`} replace />;
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
              
               {/* Rutas Autenticadas con Layout */}
            <Route element={user ? <AuthenticatedLayout /> : <LoginRedirect />}>
              <Route path="" element={<Dashboard />} />
              <Route path="profile" element={<Profile />} />
              <Route path="checkout/:pencaInstanciaId" element={<CheckoutPenca />} />
              <Route path="partidos/:idParticipacion" element={<Partidos />} />
            </Route>
            <Route element={user ? <AdminLayout /> : <LoginRedirect />}>
              <Route path="admin/pencas" element={<AdminPencas />} />
            </Route>
            
          </Routes>
        </SlugGuard>
        } 
      />

      {/* Redirección por defecto si no hay slug (landing page de demostración) */}
      <Route path="/" element={<LandingPage />} />
      
      {/* Fallback para rutas no encontradas */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
