import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const AuthenticatedLayout: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
      <Navbar />
      <main style={{ flex: 1, padding: '0 20px 40px 20px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default AuthenticatedLayout;
