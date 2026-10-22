import z from "zod";

export const LoginDtoSchema = z.object({
    email: z.string('E-mail é obrigatório').email('E-mail inválido'),
    password: z.string('Senha é obrigatória').min(6, 'Senha deve ter no mínimo 6 caracteres'),
}).strict();

export type LoginDto = z.infer<typeof LoginDtoSchema>;

export const registerDtoSchema = z.object({
    email: z.string('E-mail é obrigatório').email('E-mail inválido'),
    password: z.string('Senha é obrigatória').min(6, 'Senha deve ter no mínimo 6 caracteres').max(255, 'Senha deve ter no máximo 255 caracteres'),
    name: z.string('Nome é obrigatório').min(3, 'Nome deve ter no mínimo 3 caracteres').max(255, 'Nome deve ter no máximo 255 caracteres'),
}).strict()

export type RegisterDto = z.infer<typeof registerDtoSchema>
