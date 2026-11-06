import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "../../database/generated/prisma/client.js";
import { PrismaService } from "../../database/prisma.service.js";
import { CustomersService } from "../customers/customers.service.js";
import { ProductStockItemDto, StockMovementDto } from "../products/products.dto.js";
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
        await this.customersService.findUnique(data.customer_id) // Verifica se o cliente existe

        return this.prisma.$transaction(async tx => {
            const productItems = await this.productsService.removeStock(this.toStockMovements(data.items), tx)

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

        const nextStatus = data.status ?? order.status
        const holdsStock = this.reservesStock(order.status)
        const willHoldStock = this.reservesStock(nextStatus)
        const itemsChanged = data.items !== undefined

        const currentItems = order.items.map(item => ({ id: item.product_id, quantity: item.quantity }))
        const nextItems = data.items ? this.toStockMovements(data.items) : currentItems

        await this.prisma.$transaction(async tx => {
            if (holdsStock && (itemsChanged || !willHoldStock)) {
                await this.productsService.addStock(currentItems, tx)
            }

            let productItems: ProductStockItemDto[] | undefined

            if (willHoldStock && (itemsChanged || !holdsStock)) {
                const reservedItems = await this.productsService.removeStock(nextItems, tx)
                productItems = itemsChanged ? reservedItems : undefined
            } else if (itemsChanged) {
                productItems = await this.productsService.loadStockItems(nextItems, tx)
            }

            await this.ordersRepository.update(id, {
                customer_id: data.customer_id,
                delivery_date: data.delivery_date,
                pickup_date: data.pickup_date,
                status: data.status,
                payment_method: data.payment_method,
                observations: data.observations,
                total_price: productItems ? this.calculateTotalPrice(productItems) : undefined,
                items: productItems ? this.toOrderItems(productItems) : undefined,
            }, tx)
        })

        return this.findOne(id)
    }

    private reservesStock(status: Order['status']) {
        return status !== "CANCELLED" && status !== "COMPLETED"
    }

    private toStockMovements(items: CreateOrderDto['items']): StockMovementDto[] {
        return items.map(item => ({ id: item.product_id, quantity: item.qtd }))
    }

    private toOrderItems(productItems: ProductStockItemDto[]) {
        return productItems.map(({ product, quantity }) => ({
            product_id: product.id,
            quantity,
            unit_price: product.unit_price,
            subtotal: product.unit_price * quantity,
        }))
    }

    private async createPendingOrder({ order, totalPrice, productItems }: CreatePendingOrderDto, tx: Prisma.TransactionClient) {
        const pendingOrder = await this.ordersRepository.create({
            ...order,
            status: "PENDING_DELIVERY",
            total_price: totalPrice,
            items: this.toOrderItems(productItems),
        }, tx)

        return pendingOrder
    }

    private calculateTotalPrice(products: ProductStockItemDto[]) {
        return products.reduce((acc, p) => acc + p.product.unit_price * p.quantity, 0)
    }
}
