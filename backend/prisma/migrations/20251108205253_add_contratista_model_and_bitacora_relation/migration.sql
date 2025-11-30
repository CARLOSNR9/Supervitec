-- AlterTable
ALTER TABLE "Bitacora" ADD COLUMN     "contratistaId" INTEGER;

-- CreateTable
CREATE TABLE "contratistas" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "responsable" TEXT,
    "email" TEXT,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contratistas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contratistas_nombre_key" ON "contratistas"("nombre");

-- CreateIndex
CREATE INDEX "Bitacora_contratistaId_idx" ON "Bitacora"("contratistaId");

-- AddForeignKey
ALTER TABLE "Bitacora" ADD CONSTRAINT "Bitacora_contratistaId_fkey" FOREIGN KEY ("contratistaId") REFERENCES "contratistas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
