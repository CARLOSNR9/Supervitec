-- AlterTable
ALTER TABLE "contratistas" ADD COLUMN     "directorId" INTEGER;

-- AddForeignKey
ALTER TABLE "contratistas" ADD CONSTRAINT "contratistas_directorId_fkey" FOREIGN KEY ("directorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
