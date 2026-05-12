/**
 * Definiciones de tipos para el dominio de la aplicación.
 * Estos tipos deben coincidir con los DTOs devueltos por la API .NET.
 */

export interface User {
  id: number;
  nombre: string;
  email: string;
  sitioId: number;
  rol: number;
}

export interface AuthResponse {
  jwt: string;
  usuario: User;
}

export interface Sitio {
  id: number;
  nombre: string;
  descripcion?: string;
  logoUrl?: string;
  colorPrincipal?: string;
  tipoRegistro: string;
}
