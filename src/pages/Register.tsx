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
  const [codigoInvitacion] = useState(searchParams.get('code') || '');
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
      <div className="container-simple text-center">
        <h2>Este sitio es solo con invitación.</h2>
        <p className="text-muted mt-4">El enlace utilizado no es válido, ha expirado o ya no tiene usos disponibles.</p>
        <div className="mt-4">
          <Link to={`/${slug}/login`} className="btn-secondary">
            Volver al Inicio de Sesión
          </Link>
        </div>
      </div>
    );
  }

  // Mientras se valida el código, mostramos loading
  if (site && site.tipoRegistro === TipoRegistro.SoloConInvitacion && isCodeValid === null) {
    return (
      <div className="text-center mt-4">
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
      <div className="container-simple text-center">
        <h2>¡Solicitud enviada!</h2>
        <div style={{ padding: '20px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '8px', marginTop: '15px', marginBottom: '20px' }}>
          {successMessage}
        </div>
        <Link to={`/${slug}/login`} className="btn-secondary">
          Volver al Inicio de Sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="container-simple text-center">
      <h1>Crear Cuenta en {site?.nombre || slug}</h1>
      <p className="text-muted mb-4">Regístrate para empezar a jugar</p>

      {(site?.tipoRegistro === TipoRegistro.AbiertaConAutorizacion || site?.tipoRegistro === TipoRegistro.SoloConInvitacion) && (
        <div style={{ padding: '10px', backgroundColor: '#fff3cd', color: '#856404', borderRadius: '6px', fontSize: '0.9rem', marginBottom: '15px' }}>
          <strong>Atención:</strong> Tu registro quedará pendiente de aprobación.
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
        <div className="form-group">
          <input
            type="text"
            placeholder="Nombre completo"
            className="form-input"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <input
            type="email"
            placeholder="Correo electrónico"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <input
            type="password"
            placeholder="Contraseña"
            className="form-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {site?.tipoRegistro === TipoRegistro.SoloConInvitacion && (
          <input
            type="hidden"
            name="codigoInvitacion"
            value={codigoInvitacion}
          />
        )}
        
        {error && <p style={{ color: 'red', fontSize: '14px', marginTop: '-10px', marginBottom: '10px' }}>{error}</p>}

        <button 
          type="submit" 
          className="btn-primary"
          disabled={loading}
        >
          {loading ? 'Registrando...' : 'Registrarse'}
        </button>
      </form>

      <p className="mt-4">
        ¿Ya tienes cuenta? <Link to={`/${slug}/login`} style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>Inicia sesión</Link>
      </p>
    </div>
  );
};

export default Register;
