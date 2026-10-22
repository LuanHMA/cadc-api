import { Injectable } from "@nestjs/common";
import { Prisma } from "../../database/generated/prisma/client.js";
import { PrismaService } from "../../database/prisma.service.js";
import { Order, OrderItem, OrderPaymentMethod, OrderType } from "./orders.entities.js";

interface FindAllOrdersInput {
    page?: number
    limit?: number
    search?: string
    delivery_date?: Date
    pickup_date?: Date
    status?: OrderType
    sort?: "asc" | "desc"
}

interface CreateOrderInput {
    customer_id: string,
    delivery_date: Date,
    pickup_date: Date,
    status: OrderType,
    payment_method: OrderPaymentMethod,
    total_price: number,
    observations?: string,
    items: CreateOrderItemInput[],
}

interface UpdateOrderInput {
    customer_id?: string,
    delivery_date?: Date,
    pickup_date?: Date,
    status?: OrderType,
    payment_method?: OrderPaymentMethod,
    total_price?: number,
    observations?: string,
}

interface CreateOrderItemInput {
    product_id: string,
    quantity: number,
    unit_price: number,
    subtotal: number,
}

interface UpdateOrderItemInput {
    product_id?: string,
    quantity?: number,
    unit_price?: number,
    subtotal?: number,
}

@Injectable()
export class OrdersRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findAll({
        page = 1,
        limit = 20,
        search = "",
        status,
        delivery_date,
        pickup_date,
        sort = "desc",
    }: FindAllOrdersInput) {

        const where: Prisma.OrderWhereInput = {
            ...(status ? { status } : undefined),
            ...(delivery_date ? { delivery_date } : undefined),
            ...(pickup_date ? { pickup_date } : undefined),
            ...(search ? {
                OR: [
                    { customer: { name: { contains: search, mode: "insensitive" } } },
                    { customer: { phone: { contains: search, mode: "insensitive" } } },
                ],
            } : undefined),
        }

        const orders = await this.prisma.order.findMany({
            where,
            orderBy: {
                created_at: sort,
            },
            skip: (page - 1) * limit,
            take: limit,
            include: {
                customer: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                items: {
                    select: {
                        id: true,
                        product_id: true,
                        quantity: true,
                        product: {
                            select: {
                                name: true,
                            },
                        },
                    }
                }
            }
        })

        return orders
    }

    async findOne(id: Order['id']) {
        const order = await this.prisma.order.findUnique({
            where: {
                id,
            },
            include: {
                customer: {
                    select: {
                        name: true,
                        address: true,
                        phone: true,
                        district: true,
                        reference_point: true,
                    }
                },
                items: {
                    select: {
                        product_id: true,
                        quantity: true,
                        unit_price: true,
                        subtotal: true,
                        product: {
                            select: {
                                name: true,
                            },
                        },
                    }
                }
            }
        })

        return order
    }

    async create({
        customer_id,
        delivery_date,
        pickup_date,
        status,
        payment_method,
        total_price,
        observations,
        items
    }: CreateOrderInput) {
        const order = await this.prisma.order.create({
            data: {
                customer_id,
                delivery_date,
                pickup_date,
                status,
                payment_method,
                total_price,
                observations: observations ?? null,
                items: {
                    create: items.map((item) => ({
                        product_id: item.product_id,
                        quantity: item.quantity,
                        unit_price: item.unit_price,
                        subtotal: item.subtotal,
                    })),
                },
            },
        })

        return order
    }

    async update(id: Order['id'], {
        customer_id,
        delivery_date,
        pickup_date,
        status,
        payment_method,
        total_price,
        observations,
    }: UpdateOrderInput) {
        const order = await this.prisma.order.update({
            where: {
                id,
            },
            data: {
                customer_id,
                delivery_date,
                pickup_date,
                status,
                payment_method,
                total_price,
                observations: observations ?? null,
            },
        })

        return order
    }

    async delete(id: Order['id']) {
        await this.prisma.order.delete({
            where: {
                id,
            },
        })
    }

    async createItem(order_id: Order['id'], {
        product_id,
        quantity,
        unit_price,
        subtotal,
    }: CreateOrderItemInput) {
        const item = await this.prisma.orderItem.create({
            data: {
                order_id,
                product_id,
                quantity,
                unit_price,
                subtotal,
            },
        })

        return item
    }

    async updateItem(item_id: OrderItem['id'], {
        product_id,
        quantity,
        unit_price,
        subtotal,
    }: UpdateOrderItemInput) {
        const item = await this.prisma.orderItem.update({
            where: {
                id: item_id,
            },
            data: {
                product_id,
                quantity,
                unit_price,
                subtotal,
            },
        })

        return item
    }

    async deleteItem(item_id: OrderItem['id']) {
        await this.prisma.orderItem.delete({
            where: {
                id: item_id,
            },
        })
    }
}