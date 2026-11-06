-- stock passa a ser o total físico. disponible_stock é o que ainda pode ser alugado.
-- O valor antigo de stock já descontava pedidos não cancelados, inclusive concluídos.

ALTER TABLE "Product" ADD COLUMN "disponible_stock" INTEGER;

UPDATE "Product" SET "disponible_stock" = "stock";

WITH units AS (
    SELECT 'TABLE'::"ProductType" AS id, oi."quantity" AS quantity, o."status"
    FROM "OrderItem" oi
    JOIN "Order" o ON o."id" = oi."order_id"
    WHERE oi."product_id" = 'TABLE' AND o."status" <> 'CANCELLED'
    UNION ALL
    SELECT 'TABLE'::"ProductType", oi."quantity", o."status"
    FROM "OrderItem" oi
    JOIN "Order" o ON o."id" = oi."order_id"
    WHERE oi."product_id" = 'KIT' AND o."status" <> 'CANCELLED'
    UNION ALL
    SELECT 'CHAIR'::"ProductType", oi."quantity", o."status"
    FROM "OrderItem" oi
    JOIN "Order" o ON o."id" = oi."order_id"
    WHERE oi."product_id" = 'CHAIR' AND o."status" <> 'CANCELLED'
    UNION ALL
    SELECT 'CHAIR'::"ProductType", oi."quantity" * 4, o."status"
    FROM "OrderItem" oi
    JOIN "Order" o ON o."id" = oi."order_id"
    WHERE oi."product_id" = 'KIT' AND o."status" <> 'CANCELLED'
),
sums AS (
    SELECT
        id,
        COALESCE(SUM(quantity) FILTER (WHERE status = 'COMPLETED'), 0) AS completed_qty,
        COALESCE(SUM(quantity) FILTER (WHERE status <> 'COMPLETED'), 0) AS active_qty
    FROM units
    GROUP BY id
)
UPDATE "Product" p
SET
    "stock" = p."stock" + s.completed_qty + s.active_qty,
    "disponible_stock" = p."disponible_stock" + s.completed_qty
FROM sums s
WHERE p."id" = s.id;

UPDATE "Product" AS kit
SET
    "stock" = LEAST(tables."stock", chairs."stock" / 4),
    "disponible_stock" = LEAST(tables."disponible_stock", chairs."disponible_stock" / 4)
FROM "Product" AS tables, "Product" AS chairs
WHERE kit."id" = 'KIT'
  AND tables."id" = 'TABLE'
  AND chairs."id" = 'CHAIR';

ALTER TABLE "Product" ALTER COLUMN "disponible_stock" SET NOT NULL;

ALTER TABLE "Product" ADD CONSTRAINT "Product_disponible_stock_bounds"
CHECK ("disponible_stock" >= 0 AND "disponible_stock" <= "stock");
