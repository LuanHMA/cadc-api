import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe.js";
import { CreateOrderBodySchema, OrderIdSchema, type CreateOrderDto, type FindAllOrdersDto, type OrderIdDto } from "./orders.dto.js";
import { OrderService } from "./orders.service.js";

@Controller('orders')
export class OrdersController {
    constructor(private readonly orderService: OrderService) { }

    @Get()
    async findAll(@Query() query: FindAllOrdersDto) {
        const orders = await this.orderService.findAll(query)
        return { message: 'Pedidos encontrados com sucesso', orders }
    }

    @Get(':id')
    async findOne(@Param('id', new ZodValidationPipe(OrderIdSchema)) id: OrderIdDto) {
        const order = await this.orderService.findOne(id)
        return { message: 'Pedido encontrado com sucesso', order }
    }

    @Post()
    async create(@Body(new ZodValidationPipe(CreateOrderBodySchema)) body: CreateOrderDto) {
        const order = await this.orderService.create(body)
        return { message: 'Pedido criado com sucesso', order }
    }
}