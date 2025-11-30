/*
  Warnings:

  - A unique constraint covering the columns `[prefijo]` on the table `Obra` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `prefijo` to the `Obra` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'DIRECTOR';

-- AlterTable
ALTER TABLE "Obra" ADD COLUMN     "observaciones" TEXT,
ADD COLUMN     "prefijo" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Obra_prefijo_key" ON "Obra"("prefijo");
