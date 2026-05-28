import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../api/authService';
import { useSite } from '../contexts/SiteContext';
import { useNavigate, Link, useParams, Navigate, useSearchParams } from 'react-router-dom';
import { TipoRegistro } from '../types';

const Register: React.FC = () => {
  const { register } = useAuth();
  const { site } = useSite();
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  
  const [searchParams] = useSearchParams();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [codigoInvitacion, setCodigoInvitacion] = useState(searchParams.get('code') || '');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCodeValid, setIsCodeValid] = useState<boolean | null>(null);

  // Validamos el token de invitación si el sitio es SoloConInvitacion
  useEffect(() => {
    if (site?.tipoRegistro === TipoRegistro.SoloConInvitacion) {
      if (!codigoInvitacion || !slug) {
        setIsCodeValid(false);
      } else {
        authService.validarInvitacion(codigoInvitacion, slug).then(valid => {
          setIsCodeValid(valid);
        });
      }
    } else {
      setIsCodeValid(true); // No requiere código
    }
  }, [site, codigoInvitacion, slug]);

  // Si los registros están cerrados, redirigimos al login
  if (site && site.tipoRegistro === TipoRegistro.Cerrada) {
    return <Navigate to={`/${slug}/login`} replace />;
  }

  // Si es solo con invitación y el código no es válido (o falta)
  if (site && site.tipoRegistro === TipoRegistro.SoloConInvitacion && isCodeValid === false) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px', fontFamily: 'Arial, sans-serif' }}>
        <h2>Este sitio es solo con invitación.</h2>
        <p>El enlace utilizado no es válido, ha expirado o ya no tiene usos disponibles.</p>
        <br />
        <Link to={`/${slug}/login`} style={{ color: site?.colorPrincipal || '#4285F4', textDecoration: 'none', fontWeight: 'bold' }}>
          Volver al Inicio de Sesión
        </Link>
      </div>
    );
  }

  // Mientras se valida el código, mostramos loading
  if (site && site.tipoRegistro === TipoRegistro.SoloConInvitacion && isCodeValid === null) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px', fontFamily: 'Arial, sans-serif' }}>
        <p>Validando invitación...</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await register({
        nombre,
        email,
        password,
        sitioId: 0, // El backend lo resolverá vía el slug provisto
        tokenInvitacion: site?.tipoRegistro === TipoRegistro.SoloConInvitacion ? codigoInvitacion : undefined
      }, slug);
      
      if (result && result.status === 'pending') {
         setSuccessMessage(result.mensaje || 'Tu registro ha quedado pendiente de aprobación.');
      } else {
         navigate(`/${slug}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Error al registrar el usuario');
    } finally {
      setLoading(false);
    }
  };

  if (successMessage) {
    return (
      <div style={{ 
        display: 'flex', flexDirection: 'column', alignItems: 'center', 
        justifyContent: 'center', height: '80vh', fontFamily: 'Arial, sans-serif', textAlign: 'center', padding: '20px'
      }}>
        <h2>¡Solicitud enviada!</h2>
        <div style={{ padding: '20px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '8px', maxWidth: '400px', marginTop: '10px' }}>
          {successMessage}
        </div>
        <p style={{ marginTop: '20px' }}>
          <Link to={`/${slug}/login`} style={{ color: site?.colorPrincipal || '#4285F4', textDecoration: 'none', fontWeight: 'bold' }}>
            Volver al Inicio de Sesión
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '80vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1>Crear Cuenta en {site?.nombre || slug}</h1>
      <p>Regístrate para empezar a jugar</p>

      {(site?.tipoRegistro === TipoRegistro.AbiertaConAutorizacion || site?.tipoRegistro === TipoRegistro.SoloConInvitacion) && (
        <div style={{ padding: '10px', backgroundColor: '#fff3cd', color: '#856404', borderRadius: '5px', width: '300px', textAlign: 'center', fontSize: '0.9rem', marginTop: '10px' }}>
          <strong>Atención:</strong> Tu registro quedará pendiente de aprobación por el administrador del sitio.
        </div>
      )}

      <form onSubmit={handleSubmit} style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        width: '300px',
        marginTop: '20px'
      }}>
        <input
          type="text"
          placeholder="Nombre completo"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
        />
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
        />

        {site?.tipoRegistro === TipoRegistro.SoloConInvitacion && (
          <input
            type="hidden"
            name="codigoInvitacion"
            value={codigoInvitacion}
          />
        )}
        
        {error && <p style={{ color: 'red', fontSize: '14px', margin: 0 }}>{error}</p>}

        <button 
          type="submit" 
          disabled={loading}
          style={{
            padding: '10px',
            backgroundColor: site?.colorPrincipal || '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px'
          }}
        >
          {loading ? 'Registrando...' : 'Registrarse'}
        </button>
      </form>

      <p style={{ marginTop: '20px' }}>
        ¿Ya tienes cuenta? <Link to={`/${slug}/login`} style={{ color: '#4285F4', textDecoration: 'none' }}>Inicia sesión</Link>
      </p>
    </div>
  );
};

export default Register;
