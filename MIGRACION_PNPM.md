# Migración a PNPM

Estoy pasándome de npm a pnpm en mis flujos de trabajo, por lo tanto, migré este proyecto para que use pnpm en vez de npm.
El objetivo de esta migración es mitigar los riesgos por los recientes ataques de cadena de suministro y vulnerabilidades descubiertas en el ecosistema de NPM. PNPM da mayor rapidez, una gestión estricta de dependencias y una capa adicional de seguridad porque bloquea la ejecución automática de scripts de post-instalación por defecto.

## Incompatibilidad con NPM

El proyecto ya no utiliza `package-lock.json`. En su lugar, el estado de las dependencias se gestiona exclusivamente a través de `pnpm-lock.yaml`. 

El uso de `npm install` no es compatible con el proyecto actual. Ejecutar comandos de NPM ignorará el archivo de bloqueo de PNPM, lo que puede resultar en la instalación de versiones incorrectas, fallos en la compilación o la reintroducción de vulnerabilidades. Es requerido utilizar `pnpm` para cualquier operación de instalación.

## Instalación de PNPM

La instalación recomendada es mediante Corepack (incluido por defecto en Node.js). Existen métodos alternativos detallados en la [documentación oficial de PNPM](https://pnpm.io/installation).

Procedimiento mediante Corepack:

1. Habilitar Corepack (requiere consola como administrador o con permisos suficientes):
   ```bash
   corepack enable
   ```

2. Preparar y fijar la versión de PNPM:
   ```bash
   corepack prepare pnpm@latest --activate
   ```

3. Verificar la instalación:
   ```bash
   pnpm --version
   ```

## Migración de Entorno Local Existente

Si ya se cuenta con una copia del repositorio clonada y dependencias instaladas mediante NPM, es necesario purgar el estado anterior antes de utilizar PNPM.

1. Eliminar la carpeta de dependencias y el archivo de bloqueo antiguo:
   ```bash
   rm -rf node_modules
   rm package-lock.json
   ```
   *(En entornos Windows PowerShell, utilizar `Remove-Item -Recurse -Force node_modules` y `Remove-Item package-lock.json`)*

2. Instalar las dependencias utilizando el nuevo manejador:
   ```bash
   pnpm install
   ```

## Equivalencia de Comandos

El flujo de trabajo se mantiene idéntico, reemplazando el prefijo de ejecución:

- Instalación de dependencias: `pnpm install` (o `pnpm i`)
- Iniciar entorno de desarrollo: `pnpm dev`
- Instalar un nuevo paquete: `pnpm add <nombre-del-paquete>`
- Eliminar un paquete: `pnpm remove <nombre-del-paquete>`
