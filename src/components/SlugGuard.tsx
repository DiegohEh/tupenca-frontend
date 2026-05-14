import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { authService } from '../api/authService';
import { useSite } from '../contexts/SiteContext';

interface SlugGuardProps {
  children: React.ReactNode;
}

/**
 * SlugGuard valida si el 'slug' en la URL existe y carga su configuración.
 */
const SlugGuard: React.FC<SlugGuardProps> = ({ children }) => {
  const { slug } = useParams<{ slug: string }>();
  const { setSite, setLoading: setSiteLoading, loading: siteLoading } = useSite();
  const [isValid, setIsValid] = useState<boolean | null>(null);

  useEffect(() => {
    const checkSlug = async () => {
      if (!slug) {
        setIsValid(false);
        setSiteLoading(false);
        return;
      }

      try {
        setSiteLoading(true);
        // Obtenemos la configuración completa del sitio
        const siteData = await authService.validarSlug(slug);
        setSite(siteData); // Guardamos en el contexto global
        setIsValid(true);
      } catch (error) {
        console.error("Slug inválido:", error);
        setIsValid(false);
        setSite(null);
      } finally {
        setSiteLoading(false);
      }
    };

    checkSlug();
  }, [slug, setSite, setSiteLoading]);

  if (siteLoading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px' }}>
        <p>Cargando configuración del sitio...</p>
      </div>
    );
  }

  if (isValid === false) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px', color: 'red' }}>
        <h1>404 - Sitio no encontrado</h1>
        <p>Lo sentimos, el sitio "{slug}" no existe en nuestra plataforma.</p>
        <button onClick={() => window.location.href = '/'}>Volver al inicio</button>
      </div>
    );
  }

  return <>{children}</>;
};

export default SlugGuard;
