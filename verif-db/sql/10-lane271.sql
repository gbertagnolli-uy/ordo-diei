-- CreateTable
CREATE TABLE "Notas_Espacios" (
    "Usuario_ID" INTEGER NOT NULL,
    "Ultima_Rev" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Notas_Espacios_pkey" PRIMARY KEY ("Usuario_ID")
);

-- CreateTable
CREATE TABLE "Notas_Paginas" (
    "ID" TEXT NOT NULL,
    "Usuario_ID" INTEGER NOT NULL,
    "Rev" INTEGER NOT NULL,
    "Datos" JSONB,
    "Purgada" BOOLEAN NOT NULL DEFAULT false,
    "Updated_At" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notas_Paginas_pkey" PRIMARY KEY ("Usuario_ID","ID")
);

-- CreateIndex
CREATE INDEX "Notas_Paginas_Usuario_ID_Rev_idx" ON "Notas_Paginas"("Usuario_ID", "Rev");

-- AddForeignKey
ALTER TABLE "Notas_Espacios" ADD CONSTRAINT "Notas_Espacios_Usuario_ID_fkey" FOREIGN KEY ("Usuario_ID") REFERENCES "Usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notas_Paginas" ADD CONSTRAINT "Notas_Paginas_Usuario_ID_fkey" FOREIGN KEY ("Usuario_ID") REFERENCES "Usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

