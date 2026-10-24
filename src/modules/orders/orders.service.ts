import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { CustomersService } from "../customers/customers.service.js";
import { Product } from "../products/products.entities.js";
import { ProductsRepository } from "../products/products.repository.js";
import { CreateOrderDto, FindAllOrdersDto, FindOneOrderDto } from "./orders.dto.js";
import { OrdersRepository } from "./orders.repository.js";

@Injectable()
export class OrderService {
    constructor(
        private readonly ordersRepository: OrdersRepository,
        private readonly customersService: CustomersService,
        private readonly productsRepository: ProductsRepository
    ) { }

    async findAll(data: FindAllOrdersDto) {
        const orders = await this.ordersRepository.findAll(data)
        return orders
    }

    async findOne(data: FindOneOrderDto) {
        const order = await this.ordersRepository.findOne(data)

        if (!order) {
            throw new NotFoundException('Ordem não encontrada')
        }

        return order
    }

    async create(data: CreateOrderDto) {
        // Validar se o cliente existe
        await this.customersService.findUnique(data.customer_id)

        // Validar se os produtos existem e se o estoque é suficiente
        const items: { product: Product, quantity: number }[] = []
        const soldOutProducts: Product[] = []

        for (const item of data.items) {
            const product = await this.productsRepository.findUnique(item.product_id)

            if (!product) {
                throw new NotFoundException('Produto não encontrado')
            }

            if (product.stock < item.quantity) {
                soldOutProducts.push(product)
                continue
            }

            items.push({ product, quantity: item.quantity })
        }

        // Validar se os produtos estão esgotados
        if (soldOutProducts.length > 0) {
            throw new BadRequestException('Produtos esgotados: ' + soldOutProducts.map(product => product.name).join(', '))
        }

        // Calcular o total da ordem
        const totalPrice = items.reduce((acc, item) => acc + item.product.unit_price * item.quantity, 0)

        // Criar o pedido
        const order = await this.ordersRepository.create({
            customer_id: data.customer_id,
            delivery_date: data.delivery_date,
            pickup_date: data.pickup_date,
            status: "PENDING_DELIVERY",
            payment_method: data.payment_method,
            total_price: totalPrice,
            observations: data.observations,
            items: items.map(item => ({
                product_id: item.product.id,
                quantity: item.quantity,
                unit_price: item.product.unit_price,
                subtotal: item.product.unit_price * item.quantity,
            })),
        })

        // Atualizar o estoque dos produtos
        for (const item of items) {
            await this.productsRepository.update(item.product.id, {
                stock: item.product.stock - item.quantity,
            })
        }

        return order

    }
}