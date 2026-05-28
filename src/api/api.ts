import axios from 'axios';

/**
 * Instancia centralizada de Axios para realizar peticiones a la API .NET.
 * Se configura con la URL base definida en el archivo .env.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para inyectar el token JWT automáticamente basado en el slug actual
api.interceptors.request.use((config) => {
  const pathParts = window.location.pathname.split('/');
  const currentSlug = pathParts[1] !== 'login' && pathParts[1] !== 'register' && pathParts[1] !== '' ? pathParts[1] : null;
  
  const tokenKey = currentSlug ? `authToken_${currentSlug}` : 'authToken';
  const token = localStorage.getItem(tokenKey);
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
