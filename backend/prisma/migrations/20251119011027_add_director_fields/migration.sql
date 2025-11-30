-- AlterTable
ALTER TABLE "Obra" ADD COLUMN     "directorId" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "maxObras" INTEGER DEFAULT 1,
ADD COLUMN     "maxUsers" INTEGER DEFAULT 3,
ADD COLUMN     "ownerDirectorId" INTEGER;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_ownerDirectorId_fkey" FOREIGN KEY ("ownerDirectorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Obra" ADD CONSTRAINT "Obra_directorId_fkey" FOREIGN KEY ("directorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
