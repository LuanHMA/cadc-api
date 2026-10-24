import z from "zod";

// CREATE CUSTOMER DTO
export const CreateCustomerBodySchema = z.object({
    name: z.string("Nome é obrigatório").min(1).max(255),
    phone: z.string("Telefone é obrigatório").min(1),
    address: z.string("Endereço é obrigatório").min(1).max(255),
    district: z.string("Bairro é obrigatório").min(1).max(255),
    reference_point: z.string("Ponto de referência é opcional").optional(),
});

export type CreateCustomerDto = z.infer<typeof CreateCustomerBodySchema>;

// UPDATE CUSTOMER DTO
export const UpdateCustomerBodySchema = z.object({
    name: z.string("Nome é obrigatório").min(1).max(255).optional(),
    phone: z.string("Telefone é obrigatório").min(1).optional(),
    address: z.string("Endereço é obrigatório").min(1).max(255).optional(),
    district: z.string("Bairro é obrigatório").min(1).max(255).optional(),
    reference_point: z.string("Ponto de referência é opcional").optional(),
});

export type UpdateCustomerDto = z.infer<typeof UpdateCustomerBodySchema>;
