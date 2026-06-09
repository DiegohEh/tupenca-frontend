import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSite } from '../contexts/SiteContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { site } = useSite();
  const { slug } = useParams<{ slug: string }>();

  if (!user) return null;

console.log('rol:', user?.rol, typeof user?.rol);

  return (
    // Navbar.tsx - agregá position sticky al nav directamente
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 20px',
        backgroundColor: 'white',
        borderBottom: '1px solid var(--border-color)',
        //marginBottom: '20px',
        position: 'sticky',  // ← agregá esto
        top: 0,              // ← y esto
        zIndex: 100          // ← y esto
      }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <Link to={`/${slug}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'var(--text-color)', fontWeight: 'bold', fontSize: '18px' }}>
          {site?.logoUrl && (
            <img src={site.logoUrl} alt="Logo" style={{ height: '30px', objectFit: 'contain' }} />
          )}
          {site?.nombre || 'tupenca.uy'}
        </Link>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
          Hola, <strong>{user.nombre}</strong>
        </span>
        <Link to={`/${slug}/profile`} style={{ textDecoration: 'none', color: 'var(--primary-color)' }}>
          Mi Perfil
        </Link>

        {user.rol === 1  && (
          <Link to={`/${slug}/admin/pencas`} style={{ textDecoration: 'none', color: 'var(--primary-color)' }}>
            Admin
          </Link>
        )}
        <button 
          onClick={logout}
          style={{
            background: 'none',
            border: 'none',
            color: 'red',
            cursor: 'pointer',
            fontSize: '14px',
            padding: 0
          }}
        >
          Cerrar Sesión
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
