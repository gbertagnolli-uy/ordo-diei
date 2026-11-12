# Migración de `18_OrdoDiei` a otra computadora

Este repositorio raíz (rama `workspace` en `gbertagnolli-uy/ordo-diei`) versiona todo el entorno fuera del código principal:
- `vault/` (conocimiento, protocolo y lanes)
- `verif-db/` (scripts, SQL y datos de Postgres local; sin `node_modules` ni `postmaster.pid`)
- Carpetas de assets y archivos sueltos en la raíz (`3D/`, `Cards/`, `Heroes/`, `Imagenes/`, `Niveles/`, `Pergamino/`, `Productos/`, PDFs, EPUBs, imágenes y `.glb`)
- `_migracion/uploads/` (copia de `ordo-diei/public/uploads/`)

Las variables de entorno (`.env` y `.env.local`) están excluidas por seguridad y deben copiarse aparte.

## Pasos en la computadora nueva

1. Clonar la rama `workspace` como raíz `18_OrdoDiei`:
   ```powershell
   git clone --branch workspace https://github.com/gbertagnolli-uy/ordo-diei.git 18_OrdoDiei
   cd 18_OrdoDiei
   ```
2. Ejecutar el script de restauración (clona `ordo-diei` en rama `dev`, restaura `public/uploads/`, clona los 7 repos de `repos-externos/` en sus commits exactos e instala dependencias con `npm ci`):
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\restaurar-entorno.ps1
   ```
3. Copiar manualmente `.env` y `.env.local` desde la PC anterior a `18_OrdoDiei\ordo-diei\`.
