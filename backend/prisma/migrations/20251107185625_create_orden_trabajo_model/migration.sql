/*
  Warnings:

  - The `estado` column on the `ordenes_trabajo` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[nOrden]` on the table `ordenes_trabajo` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `nOrden` to the `ordenes_trabajo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `objetivo` to the `ordenes_trabajo` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EstadoOT" AS ENUM ('PENDIENTE', 'EN_PROCESO', 'FINALIZADA', 'CANCELADA', 'APROBADA', 'RECHAZADA');

-- DropForeignKey
ALTER TABLE "public"."ordenes_trabajo" DROP CONSTRAINT "ordenes_trabajo_obraId_fkey";

-- AlterTable
ALTER TABLE "ordenes_trabajo" ADD COLUMN     "actividad" TEXT,
ADD COLUMN     "carpeta" TEXT,
ADD COLUMN     "estadoActividad" "EstadoActividad",
ADD COLUMN     "nOrden" TEXT NOT NULL,
ADD COLUMN     "objetivo" TEXT NOT NULL,
ADD COLUMN     "observaciones" TEXT,
ALTER COLUMN "identificacion" DROP NOT NULL,
DROP COLUMN "estado",
ADD COLUMN     "estado" "EstadoOT" NOT NULL DEFAULT 'PENDIENTE';

-- CreateIndex
CREATE UNIQUE INDEX "ordenes_trabajo_nOrden_key" ON "ordenes_trabajo"("nOrden");

-- AddForeignKey
ALTER TABLE "ordenes_trabajo" ADD CONSTRAINT "ordenes_trabajo_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra"("id") ON DELETE CASCADE ON UPDATE CASCADE;
