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

// STOCK DTOS
export type StockMovementDto = {
    id: Product['id'],
    quantity: number
}

export type ProductStockItemDto = {
    product: Product,
    quantity: number
}
