import z from "zod";

export const createProductSchema = z.object({
    name: z.string("Nome é obrigatório").min(1).max(255),
    stock: z.number("Estoque é obrigatório").min(0),
    unit_price: z.number("Preço unitário é obrigatório").min(0),
    promocional_price: z.number("Preço promocional é opcional").min(0).optional(),
})

export type CreateProductDto = z.infer<typeof createProductSchema>

export const updateProductSchema = z.object({
    name: z.string("Nome é obrigatório").min(1).max(255).optional(),
    stock: z.number("Estoque é obrigatório").min(0).optional(),
    unit_price: z.number("Preço unitário é obrigatório").min(0).optional(),
    promocional_price: z.number("Preço promocional é opcional").min(0).optional(),
})

export type UpdateProductDto = z.infer<typeof updateProductSchema>

