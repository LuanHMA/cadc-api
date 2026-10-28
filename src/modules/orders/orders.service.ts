import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "../../database/generated/prisma/client.js";
import { PrismaService } from "../../database/prisma.service.js";
import { CustomersService } from "../customers/customers.service.js";
import { ProductStockItemDto } from "../products/products.dto.js";
import { ProductsService } from "../products/products.service.js";
import { CreateOrderDto, CreatePendingOrderDto, FindAllOrdersDto } from "./orders.dto.js";
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
