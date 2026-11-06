/*
  Warnings:

  - You are about to drop the column `address` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `reference_point` on the `Customer` table. All the data in the column will be lost.
  - Added the required column `house_number` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `street` to the `Customer` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Customer" DROP COLUMN "address",
DROP COLUMN "reference_point",
ADD COLUMN     "complement" TEXT,
ADD COLUMN     "house_number" TEXT NOT NULL,
ADD COLUMN     "street" TEXT NOT NULL;
