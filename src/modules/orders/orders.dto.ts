import z from "zod";


// FIND ALL ORDERS DTO
const OrderTypeSchema = z.enum(["PENDING_DELIVERY", "DELIVERED", "PENDING_PICKUP", "COMPLETED", "CANCELLED"]);

export const FindAllOrdersQuerySchema = z.object({
    page: z.number("Página inválida").min(1, "Página inválida").optional(),
    limit: z.number("Limite inválido").min(1, "Limite inválido").max(100, "Limite inválido").optional(),
    sort: z.enum(["asc", "desc"]).optional(),
    search: z.string("Busca inválida").optional(),
    delivery_date: z.date("Data de entrega inválida").optional(),
    pickup_date: z.date("Data de retirada inválida").optional(),
    status: OrderTypeSchema.optional(),
}).strict();

export type FindAllOrdersDto = z.infer<typeof FindAllOrdersQuerySchema>;


// FIND ONE ORDER DTO
export const FindOneOrderParamSchema = z.string("ID da ordem inválido").uuid('ID da ordem é obrigatório');
export type FindOneOrderDto = z.infer<typeof FindOneOrderParamSchema>;

// CREATE ORDER DTO
const OrderPaymentMethodSchema = z.enum(["CASH", "CREDIT_CARD", "DEBIT_CARD", "PIX", "OTHER"]);

export const CreateOrderBodySchema = z.object({
    customer_id: z.string("ID do cliente inválido").uuid('ID do cliente é obrigatório'),
    delivery_date: z.date("Data de entrega inválida"),
    pickup_date: z.date("Data de retirada inválida"),
    payment_method: OrderPaymentMethodSchema,
    observations: z.string("Observações inválidas").optional(),
    items: z.array(z.object({
        product_id: z.string("ID do produto inválido").uuid('ID do produto é obrigatório'),
        quantity: z.number("Quantidade inválida").min(1, "Quantidade inválida"),
    })),
}).strict();

export type CreateOrderDto = z.infer<typeof CreateOrderBodySchema>;


