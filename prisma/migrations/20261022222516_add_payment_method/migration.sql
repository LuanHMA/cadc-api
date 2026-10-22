/*
  Warnings:

  - Added the required column `payment_method` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "OrderPaymentMethod" AS ENUM ('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'PIX', 'OTHER');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "payment_method" "OrderPaymentMethod" NOT NULL;
