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
  tienePassword: boolean;
}

export interface AuthResponse {
  jwt: string;
  usuario: User;
}

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface RegisterCredentials {
  nombre: string;
  email: string;
  password: string;
  sitioId: number;
  tokenInvitacion?: string;
}

export interface Sitio {
  nombre: string;
  slug: string;
  tipoRegistro: TipoRegistro;
  logoUrl?: string;
  colorPrincipal?: string;
}

export const TipoRegistro = {
  Abierta: 0,
  AbiertaConAutorizacion: 1,
  SoloConInvitacion: 2,
  Cerrada: 3
} as const;

export type TipoRegistro = typeof TipoRegistro[keyof typeof TipoRegistro];
