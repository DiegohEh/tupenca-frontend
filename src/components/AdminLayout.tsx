import React from 'react';
import { Outlet, Link, useParams } from 'react-router-dom';
import Navbar from './Navbar';

const AdminLayout: React.FC = () => {
  return (
    <div>
      <Navbar />
      <div style={{ padding: '0 20px' }}>
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;