/*
  Warnings:

  - You are about to drop the column `variable` on the `Bitacora` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Bitacora_variable_idx";

-- AlterTable
ALTER TABLE "Bitacora" DROP COLUMN "variable";

-- AddForeignKey
ALTER TABLE "Bitacora" ADD CONSTRAINT "Bitacora_variableId_fkey" FOREIGN KEY ("variableId") REFERENCES "variables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bitacora" ADD CONSTRAINT "Bitacora_medicionId_fkey" FOREIGN KEY ("medicionId") REFERENCES "mediciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bitacora" ADD CONSTRAINT "Bitacora_unidadId_fkey" FOREIGN KEY ("unidadId") REFERENCES "Unidad"("id") ON DELETE SET NULL ON UPDATE CASCADE;
