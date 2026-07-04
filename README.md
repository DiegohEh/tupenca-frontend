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
- SQL Server
- Visual Studio 2022 / Visual Studio Code
- Git

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
npm install
```

### Configurar variables

Crear un archivo:

```
.env
```

con las variables correspondientes del backend y Auth0.

### Ejecutar

```bash
npm run dev
```

- ...

Tecnólogo en Informática – TSI.NET 2026
