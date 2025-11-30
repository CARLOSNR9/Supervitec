-- AlterTable
ALTER TABLE "Bitacora" ADD COLUMN     "medicionId" INTEGER,
ADD COLUMN     "seguimiento" TEXT,
ADD COLUMN     "unidadId" INTEGER,
ADD COLUMN     "variableId" INTEGER;

-- CreateTable
CREATE TABLE "BitacoraSeguimientoMedia" (
    "id" SERIAL NOT NULL,
    "bitacoraId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BitacoraSeguimientoMedia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Bitacora_variableId_idx" ON "Bitacora"("variableId");

-- CreateIndex
CREATE INDEX "Bitacora_medicionId_idx" ON "Bitacora"("medicionId");

-- CreateIndex
CREATE INDEX "Bitacora_unidadId_idx" ON "Bitacora"("unidadId");

-- AddForeignKey
ALTER TABLE "BitacoraSeguimientoMedia" ADD CONSTRAINT "BitacoraSeguimientoMedia_bitacoraId_fkey" FOREIGN KEY ("bitacoraId") REFERENCES "Bitacora"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
