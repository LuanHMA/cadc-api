import z from "zod";
import { OrderPaymentMethodSchema, OrderTypeSchema } from "../orders/orders.dto.js";
import { ProductIdSchema } from "../products/products.dto.js";

const dateTime = z.iso.datetime();
const message = z.string();

export const PublicUserSchema = z.object({
    id: z.uuid(),
    name: z.string(),
    email: z.email(),
    created_at: dateTime,
    updated_at: dateTime,
});

export const AuthSessionResponseSchema = z.object({
    message,
    user: PublicUserSchema,
});

export const MessageResponseSchema = z.object({
    message,
});

export const ProductResponseSchema = z.object({
    id: ProductIdSchema,
    name: z.string(),
    stock: z.number().int(),
    disponible_stock: z.number().int(),
    unit_price: z.number(),
    promocional_price: z.number().nullable(),
    created_at: dateTime,
    updated_at: dateTime,
});

export const ProductListResponseSchema = z.object({
    message,
    products: z.array(ProductResponseSchema),
});

export const ProductItemResponseSchema = z.object({
    message,
    product: ProductResponseSchema,
});

export const CustomerResponseSchema = z.object({
    id: z.uuid(),
    name: z.string(),
    phone: z.string(),
    street: z.string(),
    house_number: z.string(),
    complement: z.string().nullable(),
    district: z.string(),
    created_at: dateTime,
    updated_at: dateTime,
});

export const CustomerListResponseSchema = z.object({
    message,
    customers: z.array(CustomerResponseSchema),
    pagination: z.object({
        page: z.number().int(),
        limit: z.number().int(),
        total: z.number().int(),
        total_pages: z.number().int(),
    }),
});

export const CustomerItemResponseSchema = z.object({
    message,
    customer: CustomerResponseSchema,
});

export const CustomerDetailResponseSchema = z.object({
    message,
    customer: CustomerResponseSchema.extend({
        active_orders: z.number().int().describe("Pedidos em andamento: aguardando entrega, entregue ou aguardando retirada"),
        completed_orders: z.number().int().describe("Pedidos concluídos"),
        total_spent: z.number().describe("Soma do total dos pedidos que não foram cancelados"),
    }),
});

const orderCustomerSummarySchema = z.object({
    id: z.uuid(),
    name: z.string(),
    phone: z.string(),
    street: z.string(),
    house_number: z.string(),
    complement: z.string().nullable(),
    district: z.string(),
});

export const OrderSummarySchema = z.object({
    id: z.uuid(),
    customer_id: z.uuid(),
    delivery_date: dateTime,
    pickup_date: dateTime,
    status: OrderTypeSchema,
    payment_method: OrderPaymentMethodSchema,
    total_price: z.number(),
    observations: z.string().nullable(),
    created_at: dateTime,
    updated_at: dateTime,
    customer: orderCustomerSummarySchema,
});

export const OrderListResponseSchema = z.object({
    message,
    orders: z.object({
        orders: z.array(OrderSummarySchema),
        pagination: z.object({
            total: z.number().int(),
            page: z.number().int(),
            limit: z.number().int(),
        }),
    }),
});

export const OrderDetailSchema = z.object({
    id: z.uuid(),
    customer_id: z.uuid(),
    delivery_date: dateTime,
    pickup_date: dateTime,
    status: OrderTypeSchema,
    payment_method: OrderPaymentMethodSchema,
    total_price: z.number(),
    observations: z.string().nullable(),
    created_at: dateTime,
    updated_at: dateTime,
    customer: z.object({
        name: z.string(),
        phone: z.string(),
        street: z.string(),
        house_number: z.string(),
        complement: z.string().nullable(),
        district: z.string(),
    }),
    items: z.array(z.object({
        product_id: ProductIdSchema,
        quantity: z.number().int(),
        unit_price: z.number(),
        subtotal: z.number(),
        product: z.object({
            name: z.string(),
        }),
    })),
});

export const OrderDetailResponseSchema = z.object({
    message,
    order: OrderDetailSchema,
});

export const CreatedOrderSchema = z.object({
    id: z.uuid(),
    customer_id: z.uuid(),
    delivery_date: dateTime,
    pickup_date: dateTime,
    status: OrderTypeSchema,
    payment_method: OrderPaymentMethodSchema,
    total_price: z.string().describe("Decimal serializado como string"),
    observations: z.string().nullable(),
    created_at: dateTime,
    updated_at: dateTime,
});

export const CreatedOrderResponseSchema = z.object({
    message,
    order: CreatedOrderSchema,
});
