import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "../../database/generated/prisma/client.js";
import { PrismaService } from "../../database/prisma.service.js";
import { CustomersService } from "../customers/customers.service.js";
import { ProductStockItemDto } from "../products/products.dto.js";
import { ProductsService } from "../products/products.service.js";
import { CreateOrderDto, CreatePendingOrderDto, FindAllOrdersDto, UpdateOrderDto } from "./orders.dto.js";
import { Order } from "./orders.entities.js";
import { OrdersRepository } from "./orders.repository.js";

@Injectable()
export class OrderService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly ordersRepository: OrdersRepository,
        private readonly customersService: CustomersService,
        private readonly productsService: ProductsService
    ) { }

    async findAll(data: FindAllOrdersDto) {
        const orders = await this.ordersRepository.findAll(data)
        return orders
    }

    async findOne(id: Order['id']) {
        const order = await this.ordersRepository.findOne(id)

        if (!order) {
            throw new NotFoundException('Ordem não encontrada')
        }

        return order
    }

    async create(data: CreateOrderDto) {
        await this.customersService.findUnique(data.customer_id)

        return this.prisma.$transaction(async tx => {
            const productItems = await this.productsService.removeStock(
                data.items.map(item => ({
                    id: item.product_id,
                    quantity: item.qtd,
                })),
                tx,
            )

            return this.createPendingOrder({
                order: data,
                totalPrice: this.calculateTotalPrice(productItems),
                productItems,
            }, tx)
        })
    }


    async updateOne(id: Order['id'], data: UpdateOrderDto) {
        const order = await this.ordersRepository.findOne(id)

        if (!order) {
            throw new NotFoundException('Pedido não encontrado')
        }

        if (data.customer_id) {
            await this.customersService.findUnique(data.customer_id)
        }

        const nextStatus = data.status ?? order.status // Se o status do pedido for alterado, ele mantém o estoque
        const holdsStock = order.status !== "CANCELLED" // Se o pedido não foi cancelado, ele mantém o estoque
        const willHoldStock = nextStatus !== "CANCELLED" // Se o status do pedido for alterado para cancelado, ele libera o estoque

        const productItems = data.items
            ? await this.loadProductItems(data.items)
            : undefined

        await this.prisma.$transaction(async tx => {
            if (holdsStock && (productItems || !willHoldStock)) {
                await this.productsService.addStock(
                    order.items.map(item => ({
                        id: item.product_id,
                        quantity: item.quantity,
                    })),
                    tx,
                )
            }

            if (willHoldStock && (productItems || !holdsStock)) {
                const nextItems = data.items ?? order.items.map(item => ({
                    product_id: item.product_id,
                    qtd: item.quantity,
                }))

                await this.productsService.removeStock(
                    nextItems.map(item => ({
                        id: item.product_id,
                        quantity: item.qtd,
                    })),
                    tx,
                )
            }

            await this.ordersRepository.update(id, {
                customer_id: data.customer_id,
                delivery_date: data.delivery_date,
                pickup_date: data.pickup_date,
                status: data.status,
                payment_method: data.payment_method,
                observations: data.observations,
                total_price: productItems ? this.calculateTotalPrice(productItems) : undefined,
                items: productItems?.map(({ product, quantity }) => ({
                    product_id: product.id,
                    quantity,
                    unit_price: product.unit_price,
                    subtotal: product.unit_price * quantity,
                })),
            }, tx)
        })

        return this.findOne(id)
    }

    private async loadProductItems(items: UpdateOrderDto['items']) {
        const productItems: ProductStockItemDto[] = []

        for (const item of items ?? []) {
            const product = await this.productsService.findUnique(item.product_id)
            productItems.push({ product, quantity: item.qtd })
        }

        return productItems
    }

    private async createPendingOrder({ order, totalPrice, productItems }: CreatePendingOrderDto, tx: Prisma.TransactionClient) {
        const pendingOrder = await this.ordersRepository.create({
            ...order,
            status: "PENDING_DELIVERY",
            total_price: totalPrice,
            items: productItems.map(({ product, quantity }) => {
                return {
                    product_id: product.id,
                    quantity: quantity,
                    unit_price: product.unit_price,
                    subtotal: product.unit_price * quantity,
                }
            }),
        }, tx)

        return pendingOrder
    }

    private calculateTotalPrice(products: ProductStockItemDto[]) {
        return products.reduce((acc, p) => acc + p.product.unit_price * p.quantity, 0)
    }
}
