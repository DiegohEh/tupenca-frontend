import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';

interface PublicSite {
  name: string;
  slug: string;
  active: boolean;
  tipoRegistro: number;
  logoUrl?: string;
  colorPrincipal?: string;
}

const LandingPage = () => {
  const [sites, setSites] = useState<PublicSite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSites = async () => {
      try {
        // Asumiendo que api no incluye /api/sitios por defecto si no es a través de un controller base
        // Si axiosConfig.ts pre-asigna '/api', entonces solo se usa '/sitios/publicos'
        const response = await api.get('/sitios/publicos');
        setSites(response.data);
      } catch (error) {
        console.error("Error al cargar sitios públicos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSites();
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f4f7f6', fontFamily: "'Inter', sans-serif" }}>
      {/* Hero Section */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #eaeaea', padding: '40px 20px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: '900', marginBottom: '15px', color: 'var(--primary-color)' }}>
          TUPENCA.UY
        </h1>
        <p style={{ fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto', color: '#555', lineHeight: '1.6' }}>
          La plataforma definitiva para gestionar y participar en pencas deportivas. Juega con tus amigos o únete a las mejores ligas del país.
        </p>
      </div>

      {/* Directorio de Sitios */}
      <div style={{ padding: '50px 20px', maxWidth: '1000px', margin: '0 auto', width: '100%', flex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '2rem', color: '#333', fontWeight: 'bold' }}>Directorio de Sitios</h2>
          <p style={{ color: '#666' }}>Descubre los sitios activos y únete a la diversión.</p>
        </div>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Cargando directorio...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {sites.length > 0 ? sites.map((site, index) => {
              if (!site.active) return null;
              const siteColor = site.colorPrincipal || 'var(--primary-color)';
              return (
                <Link key={index} to={`/${site.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ padding: '25px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', transition: 'transform 0.2s', borderTop: `4px solid ${siteColor}`, cursor: 'pointer', display: 'flex', flexDirection: 'column', aspectRatio: '1 / 1', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                    
                    <div style={{ height: '70px', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '15px' }}>
                      {site.logoUrl ? (
                        <img src={site.logoUrl} alt={`Logo ${site.name}`} style={{ maxHeight: '100%', maxWidth: '160px', objectFit: 'contain' }} />
                      ) : (
                        <div style={{ width: '60px', height: '60px', borderRadius: '12px', backgroundColor: siteColor, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold' }}>
                          {site.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    
                    <h3 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '1.2rem', lineHeight: '1.2' }}>{site.name}</h3>

                    <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', width: '100%' }}>
                      <span style={{ fontSize: '0.85rem', color: '#888', backgroundColor: '#f4f7f6', padding: '4px 8px', borderRadius: '4px' }}>
                        /{site.slug}
                      </span>
                      <span style={{ color: siteColor, fontSize: '0.9rem', fontWeight: 'bold' }}>Ingresar →</span>
                    </div>
                  </div>
                </Link>
              );
            }) : (
               <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', backgroundColor: 'white', borderRadius: '12px', color: '#888' }}>
                 No hay sitios disponibles en este momento.
               </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{ backgroundColor: 'white', borderTop: '1px solid #eaeaea', color: '#666', textAlign: 'center', padding: '20px', fontSize: '0.9rem' }}>
        &copy; {new Date().getFullYear()} Tupenca.uy - TSI.NET
      </footer>
    </div>
  );
};

export default LandingPage;