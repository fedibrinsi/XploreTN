-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CITOYEN', 'TOURISTE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'TOURISTE';
