import z from "zod";

export const LoginDtoSchema = z.object({
    email: z.string('E-mail é obrigatório').email('E-mail inválido'),
    password: z.string('Senha é obrigatória').min(6, 'Senha deve ter no mínimo 6 caracteres'),
}).strict();

export type LoginDto = z.infer<typeof LoginDtoSchema>;
