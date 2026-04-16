# Configuración de Supabase - Ordo Diei

Este archivo contiene la información sensible y de configuración para el despliegue en Supabase.

## Credenciales del Proyecto
- **Project URL:** https://bdtwgibxxakgeedpwtde.supabase.co
- **Project Ref:** `bdtwgibxxakgeedpwtde`
- **Database Password:** `@wURmqX-J8pUFr2`
- **Publishable Key:** `sb_publishable_p4uvmWr6UPJO4-6VBkxRPg_fh5C_QkL`

## URLs de Conexión (Prisma)
- **Transaction Pooler (Port 6543):**
  `postgresql://postgres:%40wURmqX-J8pUFr2@db.bdtwgibxxakgeedpwtde.supabase.co:6543/postgres?pgbouncer_true`
- **Direct Connection (Port 5432):**
  `postgresql://postgres:%40wURmqX-J8pUFr2@db.bdtwgibxxakgeedpwtde.supabase.co:5432/postgres`

## Pasos Realizados
1. [x] Creación de archivo .env con las nuevas credenciales.
2. [x] Vinculación del proyecto mediante Supabase CLI.
3. [x] Sincronización de esquema con `npx prisma db push`.
