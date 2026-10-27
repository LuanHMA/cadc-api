import z from "zod";

export const CustomerIdSchema = z.object({
    id: z.string("ID é obrigatório").uuid("ID deve ser um UUID válido"),
});

export type CustomerIdDto = z.infer<typeof CustomerIdSchema>;


// CREATE CUSTOMER DTO
export const CreateCustomerBodySchema = z.object({
    name: z.string("Nome é obrigatório").min(1).max(255),
    phone: z.string("Telefone é obrigatório").regex(/^\d{11}$/, "Telefone deve ter 11 dígitos"),
    address: z.string("Endereço é obrigatório").min(1).max(255),
    district: z.string("Bairro é obrigatório").min(1).max(255),
    reference_point: z.string("Ponto de referência é opcional").optional(),
});

export type CreateCustomerDto = z.infer<typeof CreateCustomerBodySchema>;

export const UpdateCustomerBodySchema = z.object({
    name: z.string("Nome é obrigatório").min(1).max(255).optional(),
    phone: z.string("Telefone é obrigatório").min(1).optional(),
    address: z.string("Endereço é obrigatório").min(1).max(255).optional(),
    district: z.string("Bairro é obrigatório").min(1).max(255).optional(),
    reference_point: z.string("Ponto de referência é opcional").optional(),
});

export type UpdateCustomerDto = z.infer<typeof UpdateCustomerBodySchema>;

const optionalFilter = z
    .string()
    .trim()
    .max(255)
    .optional()
    .transform((value) => value || undefined);

export const FindAllCustomersQuerySchema = z.object({
    page: z.coerce.number("Página inválida").int("Página inválida").min(1, "Página inválida").default(1),
    limit: z.coerce.number("Limite inválido").int("Limite inválido").min(1, "Limite inválido").max(100, "Limite inválido").default(20),
    name: optionalFilter,
    phone: optionalFilter,
});

export type FindAllCustomersDto = z.infer<typeof FindAllCustomersQuerySchema>;
