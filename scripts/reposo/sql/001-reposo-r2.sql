-- Reposo v2 (lane 137 · R2): SOLO agrega tablas (generado con 'prisma migrate diff'; sin DROP).
-- Aplicar con: npx prisma db execute --file scripts/reposo/sql/001-reposo-r2.sql


-- CreateTable
CREATE TABLE IF NOT EXISTS "Config_Reposo" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "Segundos_Login" INTEGER NOT NULL DEFAULT 15,
    "Segundos_Sesion" INTEGER NOT NULL DEFAULT 60,
    "Unsplash_Tema" TEXT NOT NULL DEFAULT '6sMVjTLSkeQ',
    "Unsplash_Consulta" TEXT,
    "Tam_Pool" INTEGER NOT NULL DEFAULT 150,
    "Mostrar_Ref_Catecismo" BOOLEAN NOT NULL DEFAULT true,
    "Ultima_Sincronia" TIMESTAMP(3),

    CONSTRAINT "Config_Reposo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Fotos_Unsplash" (
    "Unsplash_ID" TEXT NOT NULL,
    "Url_Raw" TEXT NOT NULL,
    "Ancho" INTEGER NOT NULL,
    "Alto" INTEGER NOT NULL,
    "Color" TEXT,
    "Blur_Hash" TEXT,
    "Autor_Nombre" TEXT NOT NULL,
    "Autor_Usuario" TEXT NOT NULL,
    "Url_Foto" TEXT NOT NULL,
    "Orientacion" TEXT NOT NULL,
    "Activa" BOOLEAN NOT NULL DEFAULT true,
    "Oculta" BOOLEAN NOT NULL DEFAULT false,
    "Descarga_Avisada" BOOLEAN NOT NULL DEFAULT false,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Fotos_Unsplash_pkey" PRIMARY KEY ("Unsplash_ID")
);

