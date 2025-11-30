/*
  Warnings:

  - You are about to drop the column `responsables` on the `Obra` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[nombre]` on the table `Obra` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Obra` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BitacoraEstado" AS ENUM ('ABIERTA', 'CERRADA');

-- CreateEnum
CREATE TYPE "BitacoraVariable" AS ENUM ('SE_INICIA', 'SE_AUTORIZA', 'SE_RECOMIENDA', 'SE_SOLICITA', 'SE_VALIDA', 'PRODUCTO_NO_CONFORME');

-- AlterTable
ALTER TABLE "Obra" DROP COLUMN "responsables",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "Bitacora" (
    "id" SERIAL NOT NULL,
    "obraId" INTEGER NOT NULL,
    "responsableId" INTEGER NOT NULL,
    "variable" "BitacoraVariable" NOT NULL,
    "estado" "BitacoraEstado" NOT NULL DEFAULT 'ABIERTA',
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaMejora" TIMESTAMP(3),
    "fechaEjecucion" TIMESTAMP(3),
    "ubicacion" TEXT,
    "registro" TEXT,
    "unidad" TEXT,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bitacora_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BitacoraMedia" (
    "id" SERIAL NOT NULL,
    "bitacoraId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BitacoraMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrdenTrabajo" (
    "id" SERIAL NOT NULL,
    "obraId" INTEGER NOT NULL,
    "responsableId" INTEGER NOT NULL,
    "tipoTrabajo" TEXT NOT NULL,
    "identificacion" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'EN_PROCESO',
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "numeroAuto" TEXT,

    CONSTRAINT "OrdenTrabajo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ObraResponsables" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ObraResponsables_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "Bitacora_obraId_idx" ON "Bitacora"("obraId");

-- CreateIndex
CREATE INDEX "Bitacora_responsableId_idx" ON "Bitacora"("responsableId");

-- CreateIndex
CREATE INDEX "Bitacora_variable_idx" ON "Bitacora"("variable");

-- CreateIndex
CREATE INDEX "Bitacora_estado_idx" ON "Bitacora"("estado");

-- CreateIndex
CREATE INDEX "Bitacora_fechaCreacion_idx" ON "Bitacora"("fechaCreacion");

-- CreateIndex
CREATE INDEX "BitacoraMedia_bitacoraId_idx" ON "BitacoraMedia"("bitacoraId");

-- CreateIndex
CREATE INDEX "_ObraResponsables_B_index" ON "_ObraResponsables"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Obra_nombre_key" ON "Obra"("nombre");

-- AddForeignKey
ALTER TABLE "Bitacora" ADD CONSTRAINT "Bitacora_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bitacora" ADD CONSTRAINT "Bitacora_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BitacoraMedia" ADD CONSTRAINT "BitacoraMedia_bitacoraId_fkey" FOREIGN KEY ("bitacoraId") REFERENCES "Bitacora"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdenTrabajo" ADD CONSTRAINT "OrdenTrabajo_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdenTrabajo" ADD CONSTRAINT "OrdenTrabajo_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ObraResponsables" ADD CONSTRAINT "_ObraResponsables_A_fkey" FOREIGN KEY ("A") REFERENCES "Obra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ObraResponsables" ADD CONSTRAINT "_ObraResponsables_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
