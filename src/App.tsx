import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import { useAuth } from './contexts/AuthContext';
import './App.css';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <Router>
      <Routes>
        {/* Si el usuario no está logueado, cualquier ruta lo manda al Login */}
        <Route 
          path="/login" 
          element={!user ? <Login /> : <Navigate to="/" />} 
        />
        
        {/* Ruta principal protegida (ejemplo simple) */}
        <Route 
          path="/" 
          element={user ? (
            <div style={{ textAlign: 'center', marginTop: '50px' }}>
              <h1>Bienvenido a la Plataforma de Pencas</h1>
              <p>Hola, {user.nombre}. Ya estás autenticado.</p>
              <Login /> {/* Reutilizamos Login para mostrar el botón de cerrar sesión */}
            </div>
          ) : (
            <Navigate to="/login" />
          )} 
        />
      </Routes>
    </Router>
  );
}

export default App;
