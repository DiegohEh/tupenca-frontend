# tupenca.uy

## Descripción

**tupenca.uy** es una plataforma web y móvil para la administración de pencas deportivas bajo una arquitectura **multi-tenant**, permitiendo que múltiples organizaciones administren sus propias instancias de forma independiente.

Cada sitio cuenta con su propia configuración, usuarios, pencas, premios y personalización visual, manteniendo el aislamiento de la información entre organizaciones.

El sistema fue desarrollado como proyecto obligatorio de la asignatura **TSI.NET 2026**.

---

## Funcionalidades principales

- Gestión de múltiples sitios (Multi-tenancy).
- Autenticación mediante credenciales internas y Google (Auth0).
- Administración de pencas deportivas.
- Predicciones de resultados.
- Tabla de posiciones automática.
- Integración con API-Football.
- Actualización automática de resultados.
- Pagos mediante PayPal.
- Chat en tiempo real.
- Notificaciones Push mediante Firebase.
- Aplicación Web.
- Aplicación Mobile.

---

## Arquitectura

El proyecto está dividido en tres repositorios:

| Repositorio | Descripción |
|-------------|-------------|
| Backend | API REST + Panel de Administración desarrollado en ASP.NET Core MVC |
| Frontend | Aplicación Web desarrollada con React + TypeScript |
| Mobile | Aplicación Android desarrollada con .NET MAUI |

---

## Tecnologías utilizadas

### Backend

- ASP.NET Core 10
- Entity Framework Core
- SQL Server
- JWT
- SignalR

### Frontend

- React
- TypeScript
- Vite
- Axios

### Mobile

- .NET MAUI
- CommunityToolkit.Mvvm

### Servicios externos

- Auth0
- API-Football
- Firebase Cloud Messaging
- Cloudinary
- PayPal

---

## Requisitos

Antes de ejecutar el proyecto es necesario tener instalado:

- .NET SDK 10
- Node.js 22 o superior
- **PNPM** (Gestor de paquetes requerido. El proyecto bloquea `npm install` por seguridad).
- SQL Server
- Visual Studio 2022 / Visual Studio Code
- Git

*Nota sobre PNPM:* Se recomienda instalarlo mediante Corepack (incluido en Node.js):
```bash
corepack enable
corepack prepare pnpm@latest --activate
```

---

## Variables de configuración

El proyecto requiere configurar distintas credenciales de servicios externos, entre ellas:

- SQL Server
- Auth0
- API-Football
- Firebase
- Cloudinary
- PayPal

Las mismas deben configurarse en los archivos de configuración correspondientes antes de ejecutar la aplicación.

---

## Instalación

Clonar el repositorio:

```bash
git clone <URL_DEL_REPOSITORIO>
```

Entrar al proyecto:

```bash
cd <Repositorio>
```

## Ejecución del Frontend

### Instalar dependencias

```bash
pnpm install
```

### Configurar variables de entorno

Vite requiere que las variables personalizadas del frontend tengan el prefijo `VITE_`.

1. **Variables Base (`.env`)**: Contiene la configuración genérica/local (se sube al repositorio):
   ```env
   VITE_API_URL=https://localhost:53276/api
   VITE_HUB_URL=https://localhost:53276/hubs
   ```

2. **Variables Secretas (`.env.local`)**: Debes crear este archivo (ignorado por Git) para almacenar tus credenciales privadas, por ejemplo:
   ```env
   VITE_PAYPAL_CLIENT_ID=tu_client_id_aqui
   ```

### Ejecutar en Desarrollo

```bash
pnpm dev
```

### Compilar para Producción (Opcional)

Para verificar estrictamente los tipos de TypeScript antes de desplegar (ej. en Vercel):
```bash
pnpm build
```

Tecnólogo en Informática – TSI.NET 2026
