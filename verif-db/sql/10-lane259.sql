-- CreateTable
CREATE TABLE "Rutina_Familiar" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "Etapas" JSONB NOT NULL,
    "Semanal_Config" JSONB NOT NULL,
    "Version" INTEGER NOT NULL DEFAULT 1,
    "Actualizado_Por_ID" INTEGER,
    "Actualizado_En" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rutina_Familiar_pkey" PRIMARY KEY ("id")
);

