import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../api/userService';
import { useSite } from '../contexts/SiteContext';

/**
 * Página de Perfil de Usuario.
 * Permite visualizar la información básica del usuario y gestionar su seguridad (contraseña).
 */
const Profile: React.FC = () => {
  const { user, updateLocalUser } = useAuth();
  const navigate = useNavigate();
  const { siteConfig } = useSite();
  
  // Estados para el formulario de contraseña
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Estados para feedback visual
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Validaciones básicas en el cliente
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas nuevas no coinciden.' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres.' });
      return;
    }

    setLoading(true);
    try {
      // Llamamos al servicio que creamos anteriormente.
      // Si el usuario no tiene password (viene de Google), mandamos null en oldPassword.
      await userService.updatePassword(user.tienePassword ? oldPassword : null, newPassword);
      
      setMessage({ type: 'success', text: 'Contraseña actualizada correctamente.' });
      updateLocalUser({tienePassword: true}); // Se asegura de que el usuario logueado tenga indicado que ahora sí tiene password (en caso de que previamente no hubiese tenido).
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.mensaje || 'Error al actualizar la contraseña.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-container" style={{ maxWidth: '500px', margin: '40px auto', padding: '20px' }}>
      
      <button 
        onClick={() => navigate(-1)} 
        style={{ 
          background: 'transparent', 
          border: 'none', 
          color: siteConfig?.colorPrincipal || '#007bff', 
          cursor: 'pointer', 
          marginBottom: '20px',
          fontSize: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '5px'
        }}
      >
        ← Volver
      </button>
      
      <h2 style={{ borderBottom: `2px solid ${siteConfig?.colorPrincipal || '#007bff'}`, paddingBottom: '10px' }}>
        Mi Perfil
      </h2>

      <div className="user-info" style={{ marginBottom: '30px', backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px' }}>
        <p><strong>Nombre:</strong> {user.nombre}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Método de acceso:</strong> {user.tienePassword ? 'Email/Password' : 'Google (Auth0)'}</p>
      </div>

      <div className="password-section">
        <h3>Seguridad</h3>
        <p style={{ fontSize: '0.9rem', color: '#666' }}>
          {user.tienePassword 
            ? 'Cambia tu contraseña actual por una nueva.' 
            : 'Tu cuenta no tiene una contraseña local. Define una para poder ingresar sin usar Google.'}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {/* Solo mostramos la contraseña actual si el usuario ya tiene una seteada */}
          {user.tienePassword && (
            <div className="form-group">
              <label>Contraseña Actual:</label>
              <input 
                type="password" 
                value={oldPassword} 
                onChange={(e) => setOldPassword(e.target.value)} 
                required 
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              />
            </div>
          )}

          <div className="form-group">
            <label>Nueva Contraseña:</label>
            <input 
              type="password" 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
              required 
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>

          <div className="form-group">
            <label>Confirmar Nueva Contraseña:</label>
            <input 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              required 
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>

          {message && (
            <div style={{ 
              padding: '10px', 
              borderRadius: '4px', 
              backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
              color: message.type === 'success' ? '#155724' : '#721c24'
            }}>
              {message.text}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              padding: '10px', 
              backgroundColor: siteConfig?.colorPrincipal || '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            {loading ? 'Procesando...' : 'Actualizar Contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
