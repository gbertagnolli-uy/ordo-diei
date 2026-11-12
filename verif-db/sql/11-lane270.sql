-- CreateEnum
CREATE TYPE "EstadoBiblioteca" AS ENUM ('sin_empezar', 'leyendo', 'leido');

-- CreateTable
CREATE TABLE "Biblioteca_Libros" (
    "id" SERIAL NOT NULL,
    "Titulo" TEXT NOT NULL,
    "Autor" TEXT,
    "Sinopsis" TEXT,
    "Portada_URL" TEXT,
    "Es_Audiolibro" BOOLEAN NOT NULL DEFAULT false,
    "Cargado_Por_ID" INTEGER,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Updated_At" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Biblioteca_Libros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Biblioteca_Archivos" (
    "id" SERIAL NOT NULL,
    "Libro_ID" INTEGER NOT NULL,
    "URL" TEXT NOT NULL,
    "Formato" TEXT NOT NULL,
    "Bytes" INTEGER,
    "Orden" INTEGER NOT NULL DEFAULT 0,
    "Titulo" TEXT,
    "Duracion_Seg" INTEGER,

    CONSTRAINT "Biblioteca_Archivos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Biblioteca_Estantes" (
    "id" SERIAL NOT NULL,
    "Nombre" TEXT NOT NULL,
    "Orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Biblioteca_Estantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Biblioteca_Estantes_Libros" (
    "Estante_ID" INTEGER NOT NULL,
    "Libro_ID" INTEGER NOT NULL,

    CONSTRAINT "Biblioteca_Estantes_Libros_pkey" PRIMARY KEY ("Estante_ID","Libro_ID")
);

-- CreateTable
CREATE TABLE "Biblioteca_Estados" (
    "Usuario_ID" INTEGER NOT NULL,
    "Libro_ID" INTEGER NOT NULL,
    "Estado" "EstadoBiblioteca" NOT NULL DEFAULT 'sin_empezar',
    "Porcentaje" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "CFI" TEXT,
    "Pagina" INTEGER,
    "Archivo_ID" INTEGER,
    "Posicion_Seg" DOUBLE PRECISION,
    "Empezado_En" TIMESTAMP(3),
    "Terminado_En" TIMESTAMP(3),
    "Updated_At" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Biblioteca_Estados_pkey" PRIMARY KEY ("Usuario_ID","Libro_ID")
);

-- CreateIndex
CREATE INDEX "Biblioteca_Libros_Titulo_idx" ON "Biblioteca_Libros"("Titulo");

-- CreateIndex
CREATE INDEX "Biblioteca_Archivos_Libro_ID_Orden_idx" ON "Biblioteca_Archivos"("Libro_ID", "Orden");

-- CreateIndex
CREATE UNIQUE INDEX "Biblioteca_Estantes_Nombre_key" ON "Biblioteca_Estantes"("Nombre");

-- CreateIndex
CREATE INDEX "Biblioteca_Estados_Usuario_ID_Estado_idx" ON "Biblioteca_Estados"("Usuario_ID", "Estado");

-- AddForeignKey
ALTER TABLE "Biblioteca_Archivos" ADD CONSTRAINT "Biblioteca_Archivos_Libro_ID_fkey" FOREIGN KEY ("Libro_ID") REFERENCES "Biblioteca_Libros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Biblioteca_Estantes_Libros" ADD CONSTRAINT "Biblioteca_Estantes_Libros_Estante_ID_fkey" FOREIGN KEY ("Estante_ID") REFERENCES "Biblioteca_Estantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Biblioteca_Estantes_Libros" ADD CONSTRAINT "Biblioteca_Estantes_Libros_Libro_ID_fkey" FOREIGN KEY ("Libro_ID") REFERENCES "Biblioteca_Libros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Biblioteca_Estados" ADD CONSTRAINT "Biblioteca_Estados_Usuario_ID_fkey" FOREIGN KEY ("Usuario_ID") REFERENCES "Usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Biblioteca_Estados" ADD CONSTRAINT "Biblioteca_Estados_Libro_ID_fkey" FOREIGN KEY ("Libro_ID") REFERENCES "Biblioteca_Libros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

