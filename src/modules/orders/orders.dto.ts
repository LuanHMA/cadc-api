import z from "zod";
import { ProductStockItemDto } from "../products/products.dto.js";

const dateFromInput = (message: string) =>
    z.iso.date(message).transform((value) => new Date(`${value}T00:00:00.000Z`));

// ORDER ID DTO
export const OrderIdSchema = z.string("ID do pedido inválido").uuid("ID do pedido inválido");

export type OrderIdDto = z.infer<typeof OrderIdSchema>;

// FIND ALL ORDERS DTO
const OrderTypeSchema = z.enum(["PENDING_DELIVERY", "DELIVERED", "PENDING_PICKUP", "COMPLETED", "CANCELLED"]);

export const FindAllOrdersQuerySchema = z.object({
    page: z.number("Página inválida").min(1, "Página inválida").optional(),
    limit: z.number("Limite inválido").min(1, "Limite inválido").max(100, "Limite inválido").optional(),
    sort: z.enum(["asc", "desc"]).optional(),
    search: z.string("Busca inválida").optional(),
    delivery_date: dateFromInput("Data de entrega inválida").optional(),
    pickup_date: dateFromInput("Data de retirada inválida").optional(),
    status: OrderTypeSchema.optional(),
}).strict();

export type FindAllOrdersDto = z.infer<typeof FindAllOrdersQuerySchema>;

// CREATE ORDER DTO
const OrderPaymentMethodSchema = z.enum(["CASH", "CREDIT_CARD", "DEBIT_CARD", "PIX", "OTHER"]);

const OrderItemBodySchema = z.object({
    product_id: z.enum(["TABLE", "CHAIR", "KIT"], "Produto inválido"),
    qtd: z.number("Quantidade inválida").int("Quantidade inválida").min(1, "Quantidade inválida"),
});

export const CreateOrderBodySchema = z.object({
    customer_id: z.string("ID do cliente inválido").uuid('ID do cliente inválido'),
    delivery_date: dateFromInput("Data de entrega inválida"),
    pickup_date: dateFromInput("Data de retirada inválida"),
    payment_method: OrderPaymentMethodSchema,
    observations: z.string("Observações inválidas").optional(),
    items: z.array(OrderItemBodySchema).min(1, "O pedido deve ter ao menos um item"),
}).strict();

export type CreateOrderDto = z.infer<typeof CreateOrderBodySchema>;

// CREATE PENDING ORDER DTO
export type CreatePendingOrderDto = {
    order: CreateOrderDto,
    totalPrice: number,
    productItems: ProductStockItemDto[]
}


// UPDATE ORDER DTO
export const UpdateOrderBodySchema = z.object({
    customer_id: z.string("ID do cliente inválido").uuid('ID do cliente inválido').optional(),
    delivery_date: dateFromInput("Data de entrega inválida").optional(),
    pickup_date: dateFromInput("Data de retirada inválida").optional(),
    payment_method: OrderPaymentMethodSchema.optional(),
    observations: z.string("Observações inválidas").optional(),
    status: OrderTypeSchema.optional(),
    items: z.array(OrderItemBodySchema).min(1, "O pedido deve ter ao menos um item").optional(),
}).strict();

export type UpdateOrderDto = z.infer<typeof UpdateOrderBodySchema>;