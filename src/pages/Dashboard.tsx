import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSite } from '../contexts/SiteContext';
import PencasList from '../components/PencasList';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { site } = useSite();

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ marginBottom: '10px' }}>
          Bienvenido a <span style={{ color: 'var(--primary-color)' }}>{site?.nombre || 'la plataforma'}</span>
        </h1>
        <p className="text-muted">Hola {user?.nombre}, selecciona una penca para participar o ver resultados.</p>
      </div>

      <div className="container-simple" style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '15px' }}>Pencas Disponibles</h2>
        <PencasList />
      </div>
    </div>
  );
};

export default Dashboard;
