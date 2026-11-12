-- CreateEnum
CREATE TYPE "SocialTipoCanal" AS ENUM ('publico', 'privado');

-- CreateEnum
CREATE TYPE "SocialTipoNotificacion" AS ENUM ('mencion', 'reaccion', 'respuesta');

-- CreateTable
CREATE TABLE "Social_Canales" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "Emoji" TEXT NOT NULL DEFAULT '😊',
    "Nombre" TEXT NOT NULL,
    "Descripcion" TEXT,
    "Slug" TEXT NOT NULL,
    "Tipo" "SocialTipoCanal" NOT NULL DEFAULT 'publico',
    "Materia_ID" INTEGER,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Deleted_At" TIMESTAMP(3),

    CONSTRAINT "Social_Canales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Social_Canal_Miembros" (
    "Canal_ID" UUID NOT NULL,
    "Usuario_ID" INTEGER NOT NULL,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Social_Canal_Miembros_pkey" PRIMARY KEY ("Canal_ID","Usuario_ID")
);

-- CreateTable
CREATE TABLE "Social_Posts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "Contenido" TEXT NOT NULL,
    "Autor_ID" INTEGER NOT NULL,
    "Canal_ID" UUID,
    "Padre_ID" UUID,
    "Enlace_LMS" JSONB,
    "Fijado" BOOLEAN NOT NULL DEFAULT false,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Updated_At" TIMESTAMP(3) NOT NULL,
    "Deleted_At" TIMESTAMP(3),

    CONSTRAINT "Social_Posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Social_Medios" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "Post_ID" UUID,
    "Autor_ID" INTEGER NOT NULL,
    "URL" TEXT NOT NULL,
    "Tipo" TEXT NOT NULL,
    "Orden" INTEGER NOT NULL DEFAULT 0,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Social_Medios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Social_Reacciones" (
    "Post_ID" UUID NOT NULL,
    "Usuario_ID" INTEGER NOT NULL,
    "Emoji" TEXT NOT NULL,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Social_Reacciones_pkey" PRIMARY KEY ("Post_ID","Usuario_ID","Emoji")
);

-- CreateTable
CREATE TABLE "Social_Notificaciones" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "Destino_ID" INTEGER NOT NULL,
    "Origen_ID" INTEGER NOT NULL,
    "Tipo" "SocialTipoNotificacion" NOT NULL,
    "Post_ID" UUID,
    "Leida" BOOLEAN NOT NULL DEFAULT false,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Social_Notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Social_Canales_Slug_key" ON "Social_Canales"("Slug");

-- CreateIndex
CREATE UNIQUE INDEX "Social_Canales_Materia_ID_key" ON "Social_Canales"("Materia_ID");

-- CreateIndex
CREATE INDEX "Social_Canal_Miembros_Usuario_ID_idx" ON "Social_Canal_Miembros"("Usuario_ID");

-- CreateIndex
CREATE INDEX "Social_Posts_Canal_ID_Created_At_idx" ON "Social_Posts"("Canal_ID", "Created_At");

-- CreateIndex
CREATE INDEX "Social_Posts_Padre_ID_idx" ON "Social_Posts"("Padre_ID");

-- CreateIndex
CREATE INDEX "Social_Posts_Autor_ID_idx" ON "Social_Posts"("Autor_ID");

-- CreateIndex
CREATE INDEX "Social_Medios_Post_ID_idx" ON "Social_Medios"("Post_ID");

-- CreateIndex
CREATE INDEX "Social_Notificaciones_Destino_ID_Leida_idx" ON "Social_Notificaciones"("Destino_ID", "Leida");

-- AddForeignKey
ALTER TABLE "Social_Canal_Miembros" ADD CONSTRAINT "Social_Canal_Miembros_Canal_ID_fkey" FOREIGN KEY ("Canal_ID") REFERENCES "Social_Canales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Social_Canal_Miembros" ADD CONSTRAINT "Social_Canal_Miembros_Usuario_ID_fkey" FOREIGN KEY ("Usuario_ID") REFERENCES "Usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Social_Posts" ADD CONSTRAINT "Social_Posts_Autor_ID_fkey" FOREIGN KEY ("Autor_ID") REFERENCES "Usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Social_Posts" ADD CONSTRAINT "Social_Posts_Canal_ID_fkey" FOREIGN KEY ("Canal_ID") REFERENCES "Social_Canales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Social_Posts" ADD CONSTRAINT "Social_Posts_Padre_ID_fkey" FOREIGN KEY ("Padre_ID") REFERENCES "Social_Posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Social_Medios" ADD CONSTRAINT "Social_Medios_Post_ID_fkey" FOREIGN KEY ("Post_ID") REFERENCES "Social_Posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Social_Reacciones" ADD CONSTRAINT "Social_Reacciones_Post_ID_fkey" FOREIGN KEY ("Post_ID") REFERENCES "Social_Posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Social_Reacciones" ADD CONSTRAINT "Social_Reacciones_Usuario_ID_fkey" FOREIGN KEY ("Usuario_ID") REFERENCES "Usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Social_Notificaciones" ADD CONSTRAINT "Social_Notificaciones_Destino_ID_fkey" FOREIGN KEY ("Destino_ID") REFERENCES "Usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Social_Notificaciones" ADD CONSTRAINT "Social_Notificaciones_Origen_ID_fkey" FOREIGN KEY ("Origen_ID") REFERENCES "Usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

