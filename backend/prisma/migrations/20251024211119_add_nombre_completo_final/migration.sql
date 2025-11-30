/*
  Warnings:

  - Added the required column `nombreCompleto` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "nombreCompleto" TEXT NOT NULL;
