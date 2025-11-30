/*
  Warnings:

  - You are about to drop the `OrdenTrabajo` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "EstadoActividad" AS ENUM ('CUMPLE', 'NO_CUMPLE', 'NO_APLICA');

-- DropForeignKey
ALTER TABLE "public"."OrdenTrabajo" DROP CONSTRAINT "OrdenTrabajo_obraId_fkey";

-- DropForeignKey
ALTER TABLE "public"."OrdenTrabajo" DROP CONSTRAINT "OrdenTrabajo_responsableId_fkey";

-- DropTable
DROP TABLE "public"."OrdenTrabajo";

-- CreateTable
CREATE TABLE "ordenes_trabajo" (
    "id" SERIAL NOT NULL,
    "obraId" INTEGER NOT NULL,
    "responsableId" INTEGER NOT NULL,
    "tipoTrabajo" TEXT NOT NULL,
    "identificacion" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'EN_PROCESO',
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "numeroAuto" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ordenes_trabajo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carpetas" (
    "id" SERIAL NOT NULL,
    "ordenTrabajoId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "indice" INTEGER NOT NULL,

    CONSTRAINT "carpetas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actividades" (
    "id" SERIAL NOT NULL,
    "carpetaId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "indice" INTEGER NOT NULL,

    CONSTRAINT "actividades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluaciones_actividad" (
    "id" SERIAL NOT NULL,
    "actividadId" INTEGER NOT NULL,
    "estado" "EstadoActividad" NOT NULL,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evaluaciones_actividad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actividad_media" (
    "id" SERIAL NOT NULL,
    "actividadId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "tipo" TEXT,
    "metadata" JSONB,

    CONSTRAINT "actividad_media_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ordenes_trabajo" ADD CONSTRAINT "ordenes_trabajo_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_trabajo" ADD CONSTRAINT "ordenes_trabajo_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carpetas" ADD CONSTRAINT "carpetas_ordenTrabajoId_fkey" FOREIGN KEY ("ordenTrabajoId") REFERENCES "ordenes_trabajo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actividades" ADD CONSTRAINT "actividades_carpetaId_fkey" FOREIGN KEY ("carpetaId") REFERENCES "carpetas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluaciones_actividad" ADD CONSTRAINT "evaluaciones_actividad_actividadId_fkey" FOREIGN KEY ("actividadId") REFERENCES "actividades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actividad_media" ADD CONSTRAINT "actividad_media_actividadId_fkey" FOREIGN KEY ("actividadId") REFERENCES "actividades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
