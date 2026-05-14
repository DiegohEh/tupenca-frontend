import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { Sitio } from '../types/index';

interface SiteContextType {
  site: Sitio | null;
  setSite: (site: Sitio | null) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const SiteContext = createContext<SiteContextType | undefined>(undefined);

/**
 * Proveedor de contexto para la información del sitio actual (Tenant).
 * Almacena datos como el nombre, logo, colores y tipo de registro.
 */
export const SiteProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [site, setSite] = useState<Sitio | null>(null);
  const [loading, setLoading] = useState(true);

  return (
    <SiteContext.Provider value={{ site, setSite, loading, setLoading }}>
      {children}
    </SiteContext.Provider>
  );
};

export const useSite = () => {
  const context = useContext(SiteContext);
  if (context === undefined) {
    throw new Error('useSite debe ser utilizado dentro de un SiteProvider');
  }
  return context;
};
