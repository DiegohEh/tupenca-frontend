import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { authService } from '../api/authService';
import { useSite } from '../contexts/SiteContext';

interface SlugGuardProps {
  children: React.ReactNode;
}

/**
 * Calcula si el color de texto debe ser blanco o negro dependiendo del color de fondo (luminosidad)
 */
const getContrastColor = (hexColor: string) => {
  if (!hexColor) return '#ffffff';
  let hex = hexColor.replace('#', '');
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#000000' : '#ffffff';
};

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
        
        // --- INYECCIÓN DE TEMA DINÁMICO ---
        const primaryColor = siteData.colorPrincipal || '#222222'; // Gris oscuro elegante por defecto
        const contrastColor = getContrastColor(primaryColor);
        
        document.documentElement.style.setProperty('--primary-color', primaryColor);
        document.documentElement.style.setProperty('--primary-text-color', contrastColor);
        // ----------------------------------

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
