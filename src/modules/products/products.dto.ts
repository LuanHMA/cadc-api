import z from "zod";
import { Product } from "./products.entities.js";

// UPDATE PRODUCT DTO
export const UpdateProductBodySchema = z.object({
    name: z.string("Nome é obrigatório").min(1).max(255).optional(),
    stock: z.number("Estoque é obrigatório").min(0).optional(),
    unit_price: z.number("Preço unitário é obrigatório").min(0).optional(),
    promocional_price: z.number("Preço promocional é opcional").min(0).optional(),
});

export type UpdateProductDto = z.infer<typeof UpdateProductBodySchema>;

// FIND UNIQUE PRODUCT PARAMS DTO
export const FindUniqueProductParamsSchema = z.enum(["TABLE", "CHAIR", "KIT"])

export type FindUniqueProductParamsDto = z.infer<typeof FindUniqueProductParamsSchema>;

// STOCK BODY DTO
export const StockBodySchema = z.object({
    chairs: z.object({
        id: z.literal("CHAIR"),
        quantity: z.number("Quantidade de cadeiras é obrigatória").int().min(0),
    }),
    tables: z.object({
        id: z.literal("TABLE"),
        quantity: z.number("Quantidade de mesas é obrigatória").int().min(0),
    }),
})

export type StockBodyDto = z.infer<typeof StockBodySchema>;

export type StockMovementDto = {
    id: Product['id'],
    quantity: number
}

export type ProductStockItemDto = {
    product: Product,
    quantity: number
}

export type UpdateKitStockDto = {
    id: Exclude<Product['id'], "KIT">
    quantity: number
}
