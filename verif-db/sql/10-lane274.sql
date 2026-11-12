-- CreateTable
CREATE TABLE "Premios_Grupales" (
    "id" SERIAL NOT NULL,
    "Titulo" TEXT NOT NULL,
    "Descripcion" TEXT,
    "Porcentaje_Meta" INTEGER NOT NULL,
    "Desde" DATE NOT NULL,
    "Hasta" DATE NOT NULL,
    "Activo" BOOLEAN NOT NULL DEFAULT true,
    "Evaluado_En" TIMESTAMP(3),
    "Cumplido" BOOLEAN,
    "Porcentaje_Final" INTEGER,
    "Creado_Por_ID" INTEGER,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Premios_Grupales_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Premios_Grupales_Activo_Desde_idx" ON "Premios_Grupales"("Activo", "Desde");

