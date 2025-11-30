-- CreateTable
CREATE TABLE "mediciones" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mediciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mediciones_nombre_key" ON "mediciones"("nombre");
