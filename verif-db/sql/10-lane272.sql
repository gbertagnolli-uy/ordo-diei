-- CreateEnum
CREATE TYPE "TipoDiario" AS ENUM ('personal', 'familiar');

-- CreateTable
CREATE TABLE "Diario_Entradas" (
    "id" SERIAL NOT NULL,
    "Tipo" "TipoDiario" NOT NULL,
    "Autor_ID" INTEGER NOT NULL,
    "Fecha" DATE NOT NULL,
    "Titulo" TEXT,
    "Texto" TEXT NOT NULL,
    "Animo" INTEGER,
    "Creada_En" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Editada_En" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Diario_Entradas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Diario_Fotos" (
    "id" SERIAL NOT NULL,
    "Entrada_ID" INTEGER NOT NULL,
    "URL" TEXT NOT NULL,
    "Orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Diario_Fotos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Diario_Entradas_Tipo_Fecha_idx" ON "Diario_Entradas"("Tipo", "Fecha");

-- CreateIndex
CREATE INDEX "Diario_Entradas_Autor_ID_Fecha_idx" ON "Diario_Entradas"("Autor_ID", "Fecha");

-- AddForeignKey
ALTER TABLE "Diario_Entradas" ADD CONSTRAINT "Diario_Entradas_Autor_ID_fkey" FOREIGN KEY ("Autor_ID") REFERENCES "Usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Diario_Fotos" ADD CONSTRAINT "Diario_Fotos_Entrada_ID_fkey" FOREIGN KEY ("Entrada_ID") REFERENCES "Diario_Entradas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

