import { Injectable } from "@nestjs/common";
import { Prisma } from "../../database/generated/prisma/client.js";
import { PrismaService } from "../../database/prisma.service.js";
import { Order, OrderItem, OrderItemType, OrderPaymentMethod, OrderType } from "./orders.entities.js";

interface FindAllOrdersInput {
    page?: number
    limit?: number
    search?: string
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
    type: OrderItemType,
    quantity: number,
    unit_price: number,
    subtotal: number,
}

interface UpdateOrderItemInput {
    type?: OrderItemType,
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
        sort = "desc",
    }: FindAllOrdersInput) {

        const where: Prisma.OrderWhereInput = {
            ...(status ? { status } : undefined),
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
                        type: true,
                        quantity: true,
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
                        type: true,
                        quantity: true,
                        unit_price: true,
                        subtotal: true,
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
        type,
        quantity,
        unit_price,
        subtotal,
    }: CreateOrderItemInput) {
        const item = await this.prisma.orderItem.create({
            data: {
                order_id,
                type,
                quantity,
                unit_price,
                subtotal,
            },
        })

        return item
    }

    async updateItem(item_id: OrderItem['id'], {
        type,
        quantity,
        unit_price,
        subtotal,
    }: UpdateOrderItemInput) {
        const item = await this.prisma.orderItem.update({
            where: {
                id: item_id,
            },
            data: {
                type,
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