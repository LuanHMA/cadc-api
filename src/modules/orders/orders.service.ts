import { Injectable, NotFoundException } from "@nestjs/common";
import { CustomersService } from "../customers/customers.service.js";
import { ProductsService } from "../products/products.service.js";
import { CreateOrderDto, FindAllOrdersDto, FindOneOrderDto } from "./orders.dto.js";
import { OrdersRepository } from "./orders.repository.js";

@Injectable()
export class OrderService {
    constructor(
        private readonly ordersRepository: OrdersRepository,
        private readonly customersService: CustomersService,
        private readonly productsService: ProductsService
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
        // Verificar se o cliente existe
        // Verficar se o produto existe
        // Verificar se o estoque do produto é suficiente
        // Criar a ordem
        // Atualizar o estoque do produto
        // Retornar a ordem criada
    }

}