import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe.js";
import { CreateOrderBodySchema, type CreateOrderDto, type FindAllOrdersDto } from "./orders.dto.js";
import { OrderService } from "./orders.service.js";

@Controller('orders')
export class OrdersController {
    constructor(private readonly orderService: OrderService) { }

    @Get()
    async findAll(@Query() query: FindAllOrdersDto) {
        const orders = await this.orderService.findAll(query)
        return { message: 'Pedidos encontrados com sucesso', orders }
    }

    @Post()
    async create(@Body(new ZodValidationPipe(CreateOrderBodySchema)) body: CreateOrderDto) {
        const order = await this.orderService.create(body)
        return { message: 'Pedido criado com sucesso', order }
    }
}