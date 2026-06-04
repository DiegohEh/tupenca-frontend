import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Pencas from './pages/Pencas';
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

const SlugRedirect = () => {
  const { slug } = useParams();
  return <Navigate to={`/${slug}`} replace />;
};

const LoginRedirect = () => {
  const { slug } = useParams();
  return <Navigate to={`/${slug}/login`} replace />;
};

function App() {
  const { user, loading } = useAuth();

  if (loading) return <div>Cargando...</div>;
  console.log(user.rol)

  return (
    <Routes>
      <Route path="/:slug/*" element={
        <SlugGuard>
          <Routes>
            <Route path="login" element={!user ? <Login /> : <SlugRedirect />} />
            <Route path="register" element={!user ? <Register /> : <SlugRedirect />} />
            <Route path="pencas" element={user ? <Pencas /> : <Navigate to="login" />} />
            <Route path="partidos/:idParticipacion" element={user ? <Partidos /> : <Navigate to="login" />} />

            {/* Rutas Autenticadas con Layout */}
            <Route element={user ? <AuthenticatedLayout /> : <LoginRedirect />}>
              <Route path="" element={<Dashboard />} />
              <Route path="profile" element={<Profile />} />
              <Route path="checkout/:pencaInstanciaId" element={<CheckoutPenca />} />
            </Route>

            <Route element={user ? <AdminLayout /> : <LoginRedirect />}>
              <Route path="admin/pencas" element={<AdminPencas />} />
            </Route>
            
          </Routes>
        </SlugGuard>
      } />

      <Route path="/" element={<LandingPage />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;