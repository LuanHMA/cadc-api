-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('TABLE', 'CHAIR', 'KIT');

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_product_id_fkey";

-- Migrate existing ids
CREATE TEMP TABLE "ProductIdMap" AS
SELECT "id" AS "old_id", CASE "name"
    WHEN 'Mesa' THEN 'TABLE'
    WHEN 'Cadeira' THEN 'CHAIR'
    WHEN 'Combo 1 mesa e 4 cadeiras' THEN 'KIT'
END AS "new_id"
FROM "Product";

UPDATE "OrderItem" oi SET "product_id" = m."new_id"
FROM "ProductIdMap" m
WHERE oi."product_id" = m."old_id";

UPDATE "Product" p SET "id" = m."new_id"
FROM "ProductIdMap" m
WHERE p."id" = m."old_id";

DROP TABLE "ProductIdMap";

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "id" TYPE "ProductType" USING "id"::"ProductType";
ALTER TABLE "OrderItem" ALTER COLUMN "product_id" TYPE "ProductType" USING "product_id"::"ProductType";

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
