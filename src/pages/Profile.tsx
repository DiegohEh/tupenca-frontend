import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../api/userService';
import { preferenciasService } from '../api/preferenciasService';
import { authService } from '../api/authService';
import { useSite } from '../contexts/SiteContext';
import { invitacionService } from '../api/invitacionService';
import { TipoRegistro } from '../types/index';
import type { PreferenciasNotificacionDTO } from '../types/index';
import { useAuth0 } from '@auth0/auth0-react';

const Profile: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user, updateLocalUser, logout } = useAuth();
  const navigate = useNavigate();
  const { site } = useSite();
  const { loginWithPopup, getAccessTokenSilently } = useAuth0();
  
  const [activeTab, setActiveTab] = useState<'general' | 'notificaciones' | 'seguridad'>(
    (sessionStorage.getItem('activeProfileTab') as any) || 'general'
  );

  // Guardar en sessionStorage cuando cambie
  useEffect(() => {
    sessionStorage.setItem('activeProfileTab', activeTab);
  }, [activeTab]);

  // Estados para Feedback general
  const [loading, setLoading] = useState(false);
  const [loadingAvatar, setLoadingAvatar] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Estados General
  const [nombre, setNombre] = useState(user?.nombre || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');

  // Estados Notificaciones
  const [preferencias, setPreferencias] = useState<PreferenciasNotificacionDTO | null>(null);
  const [loadingPrefs, setLoadingPrefs] = useState(false);

  // Estados Seguridad
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Enlace Invitación
  const [invitationLink, setInvitationLink] = useState<string | null>(null);
  const [loadingInvitation, setLoadingInvitation] = useState(false);

  useEffect(() => {
    if (activeTab === 'notificaciones' && !preferencias) {
      cargarPreferencias();
    }
  }, [activeTab]);

  const cargarPreferencias = async () => {
    if (!slug) return;
    setLoadingPrefs(true);
    try {
      const prefs = await preferenciasService.getPreferencias(slug);
      setPreferencias(prefs);
    } catch (error) {
      console.error("Error al cargar preferencias", error);
    } finally {
      setLoadingPrefs(false);
    }
  };

  if (!user) return null;

  // Manejador General
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      await userService.updateProfile(slug!, nombre, avatarUrl);
      updateLocalUser({ nombre, avatarUrl });
      setMessage({ type: 'success', text: 'Perfil actualizado correctamente.' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.mensaje || 'Error al actualizar el perfil.' });
    } finally {
      setLoading(false);
    }
  };

  // Manejador Notificaciones
  const handleUpdatePreferencias = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preferencias || !slug) return;
    setMessage(null);
    setLoading(true);
    try {
      await preferenciasService.updatePreferencias(slug, preferencias);
      setMessage({ type: 'success', text: 'Preferencias de notificación actualizadas.' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.mensaje || 'Error al actualizar preferencias.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePrefChange = (campo: keyof PreferenciasNotificacionDTO) => {
    if (!preferencias) return;
    setPreferencias({ ...preferencias, [campo]: !preferencias[campo] });
  };

  // Manejador Seguridad
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

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
      await userService.updatePassword(slug!, user.tienePassword ? oldPassword : null, newPassword);
      setMessage({ type: 'success', text: 'Contraseña actualizada correctamente.' });
      updateLocalUser({ tienePassword: true });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.mensaje || 'Error al actualizar la contraseña.' });
    } finally {
      setLoading(false);
    }
  };

  const handleLinkGoogle = async () => {
    setMessage(null);
    setLoading(true);
    try {
      await loginWithPopup({ authorizationParams: { connection: 'google-oauth2' } });
      const token = await getAccessTokenSilently();
      await authService.linkGoogle(token, slug!);
      setMessage({ type: 'success', text: 'Cuenta de Google vinculada exitosamente.' });
      updateLocalUser({ tieneGoogle: true });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.mensaje || 'Error al vincular cuenta de Google.' });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvitation = async () => {
    if (!site || !user) return;
    setLoadingInvitation(true);
    try {
      const response = await invitacionService.generar(slug!);
      const link = `${window.location.origin}/${site.slug}/register?code=${response.token}`;
      setInvitationLink(link);
      navigator.clipboard.writeText(link);
      setMessage({ type: 'success', text: 'Enlace de invitación generado y copiado al portapapeles.' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.mensaje || 'Error al generar la invitación.' });
    } finally {
      setLoadingInvitation(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !slug) return;
    
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Por favor selecciona un archivo de imagen.' });
      return;
    }
    
    setLoadingAvatar(true);
    setMessage(null);
    try {
      const res = await userService.uploadAvatar(slug, file);
      setAvatarUrl(res.url);
      updateLocalUser({ avatarUrl: res.url });
      setMessage({ type: 'success', text: 'Foto de perfil actualizada correctamente.' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.mensaje || 'Error al subir la imagen.' });
    } finally {
      setLoadingAvatar(false);
    }
  };

  return (
    <div className="container-simple" style={{ maxWidth: '800px', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button 
          onClick={() => navigate(-1)} 
          className="btn-back"
          style={{ background: 'transparent', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
        >
          ← Volver
        </button>

        <button 
          onClick={logout} 
          style={{ background: 'transparent', border: 'none', color: 'red', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}
        >
          Cerrar Sesión
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
        <div style={{ position: 'relative' }}>
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="Avatar" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', fontWeight: 'bold' }}>
              {(user.nombre || "Usuario").charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div>
          <h2 style={{ margin: 0 }}>{user.nombre || "Mi Perfil"}</h2>
          <p className="text-muted" style={{ margin: 0, marginBottom: '10px' }}>{user.email}</p>
          
          <label 
            htmlFor="avatar-upload" 
            className="btn-secondary" 
            style={{ 
              cursor: loadingAvatar ? 'not-allowed' : 'pointer', 
              fontSize: '12px', 
              padding: '4px 8px', 
              display: 'inline-block',
              opacity: loadingAvatar ? 0.6 : 1
            }}
          >
            {loadingAvatar ? 'Subiendo...' : 'Cambiar Foto'}
          </label>
          <input 
            id="avatar-upload"
            type="file" 
            accept="image/*" 
            onChange={handleFileSelect}
            disabled={loadingAvatar}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      <div className="tabs" style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '20px' }}>
        <button className={`tab ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')} style={tabStyle(activeTab === 'general')}>
          General
        </button>
        <button className={`tab ${activeTab === 'notificaciones' ? 'active' : ''}`} onClick={() => setActiveTab('notificaciones')} style={tabStyle(activeTab === 'notificaciones')}>
          Notificaciones
        </button>
        <button className={`tab ${activeTab === 'seguridad' ? 'active' : ''}`} onClick={() => setActiveTab('seguridad')} style={tabStyle(activeTab === 'seguridad')}>
          Seguridad
        </button>
      </div>

      {message && (
        <div style={{ padding: '10px', borderRadius: '6px', marginBottom: '15px', backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da', color: message.type === 'success' ? '#155724' : '#721c24' }}>
          {message.text}
        </div>
      )}

      {/* TAB GENERAL */}
      {activeTab === 'general' && (
        <div>
          <h3>Datos Básicos</h3>
          <form onSubmit={handleUpdateProfile}>
            <div className="form-group">
              <label>Nombre:</label>
              <input type="text" className="form-input" value={nombre} onChange={e => setNombre(e.target.value)} required />
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </form>

          {site?.tipoRegistro === TipoRegistro.SoloConInvitacion && (
            <div style={{ marginTop: '30px', padding: '20px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
              <h3>Invitar Usuarios</h3>
              <p className="text-muted mb-4">Genera un enlace para que otros puedan registrarse.</p>
              <button onClick={handleGenerateInvitation} disabled={loadingInvitation} className="btn-primary">
                {loadingInvitation ? 'Generando...' : 'Generar y Copiar Enlace'}
              </button>
              
              {invitationLink && (
                <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f1f1f1', borderRadius: '4px', wordBreak: 'break-all' }}>
                  <strong>Enlace:</strong> <br/>
                  <a href={invitationLink} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)' }}>{invitationLink}</a>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB NOTIFICACIONES */}
      {activeTab === 'notificaciones' && (
        <div>
          <h3>Configuración de Alertas</h3>
          {loadingPrefs ? (
            <p>Cargando preferencias...</p>
          ) : preferencias ? (
            <form onSubmit={handleUpdatePreferencias}>
              <div className="switch-group" style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label>Recibir Resultados de Partidos / Competiciones</label>
                <input type="checkbox" checked={preferencias.recibirResultados} onChange={() => handlePrefChange('recibirResultados')} style={switchStyle} />
              </div>
              <div className="switch-group" style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label>Avisos de Falta de Predicción de Partidos Próximos</label>
                <input type="checkbox" checked={preferencias.recibirPartidos} onChange={() => handlePrefChange('recibirPartidos')} style={switchStyle} />
              </div>
              <div className="switch-group" style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label>Notificaciones / Avisos Generales</label>
                <input type="checkbox" checked={preferencias.recibirGenerales} onChange={() => handlePrefChange('recibirGenerales')} style={switchStyle} />
              </div>
              <div className="switch-group" style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label>Actualizaciones de Ranking y Próximos Cruces</label>
                <input type="checkbox" checked={preferencias.recibirRanking} onChange={() => handlePrefChange('recibirRanking')} style={switchStyle} />
              </div>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar Preferencias'}
              </button>
            </form>
          ) : (
            <p>No se pudieron cargar las preferencias.</p>
          )}
        </div>
      )}

      {/* TAB SEGURIDAD */}
      {activeTab === 'seguridad' && (
        <div>
          <h3>Métodos de Autenticación</h3>
          <p className="text-muted mb-4">Estos son los métodos que tienes configurados para iniciar sesión.</p>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
            <span style={{ padding: '5px 10px', borderRadius: '4px', backgroundColor: user.tienePassword ? '#d4edda' : '#e2e3e5', color: user.tienePassword ? '#155724' : '#6c757d', fontWeight: 'bold' }}>
              {user.tienePassword ? '✅ Correo y Contraseña' : '❌ Correo y Contraseña'}
            </span>
            <span style={{ padding: '5px 10px', borderRadius: '4px', backgroundColor: user.tieneGoogle ? '#d4edda' : '#e2e3e5', color: user.tieneGoogle ? '#155724' : '#6c757d', fontWeight: 'bold' }}>
              {user.tieneGoogle ? '✅ Google (Auth0)' : '❌ Google (Auth0)'}
            </span>
          </div>

          <h3>Contraseña</h3>
          <p className="text-muted mb-4">
            {user.tienePassword ? 'Cambia tu contraseña actual por una nueva.' : 'Tu cuenta no tiene una contraseña local. Define una para poder ingresar con email.'}
          </p>

          <form onSubmit={handleUpdatePassword} style={{ marginBottom: '40px' }}>
            {user.tienePassword && (
              <div className="form-group">
                <label>Contraseña Actual:</label>
                <input type="password" className="form-input" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required />
              </div>
            )}
            <div className="form-group">
              <label>Nueva Contraseña:</label>
              <input type="password" className="form-input" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Confirmar Nueva Contraseña:</label>
              <input type="password" className="form-input" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Procesando...' : 'Actualizar Contraseña'}
            </button>
          </form>

          <hr style={{ borderColor: 'var(--border-color)', margin: '30px 0' }} />

          {!user.tieneGoogle && (
            <>
              <h3>Vincular con Google</h3>
              <p className="text-muted mb-4">
                Puedes vincular tu cuenta de Google para iniciar sesión rápidamente en el futuro.
              </p>
              <button onClick={handleLinkGoogle} disabled={loading} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962l3.007 2.332C4.672 5.164 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                {loading ? 'Vinculando...' : 'Vincular Google'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const tabStyle = (active: boolean): React.CSSProperties => ({
  flex: 1,
  padding: '10px 15px',
  background: 'none',
  border: 'none',
  borderBottom: active ? '2px solid var(--primary-color)' : '2px solid transparent',
  color: active ? 'var(--primary-color)' : 'var(--text-color)',
  fontWeight: active ? 'bold' : 'normal',
  cursor: 'pointer',
  transition: 'all 0.3s'
});

const switchStyle: React.CSSProperties = {
  width: '40px',
  height: '20px',
  cursor: 'pointer'
};

export default Profile;
