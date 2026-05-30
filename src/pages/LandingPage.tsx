import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();
  const lastSlug = localStorage.getItem('lastSlug');

  useEffect(() => {
    if (lastSlug) {
      localStorage.removeItem('lastSlug');
      navigate(`/${lastSlug}`, { replace: true });
    }
  }, [lastSlug, navigate]);

  if (lastSlug) {
    return (
      <div className="text-center mt-4">
        <p>Volviendo al sitio...</p>
      </div>
    );
  }

  // Lista de sitios hardcodeados
  const dummySites = [
    { name: "Mundial 2026", slug: "prueba-1", active: true },
    { name: "Liga AUF Uruguaya", slug: "prueba-2", active: true },
    { name: "Copa Libertadores", slug: "#", active: false },
    { name: "Champions League", slug: "#", active: false }
  ];

  return (
    <div style={{ padding: '40px 20px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '10px', color: '#111' }}>tupenca.uy</h1>
      <p className="text-muted mb-4">
        Selecciona una penca para comenzar:
      </p>
      
      <div className="sites-grid">
        {dummySites.map((site, index) => (
          site.active ? (
            <Link key={index} to={`/${site.slug}`} className="site-card">
              <h3>{site.name}</h3>
            </Link>
          ) : (
            <a 
              key={index} 
              href="#" 
              className="site-card" 
              style={{ opacity: 0.6, cursor: 'not-allowed', backgroundColor: '#f9f9f9' }} 
              onClick={(e) => e.preventDefault()}
            >
              <h3>{site.name}</h3>
            </a>
          )
        ))}
      </div>
    </div>
  );
};

export default LandingPage;