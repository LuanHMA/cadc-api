import { Controller, Get, Post, Put } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CreatedOrderResponseSchema, OrderDetailResponseSchema, OrderListResponseSchema } from "../swagger/response.schemas.js";
import { ApiDoc, ApiProtected, ZodBody, ZodParam, ZodQuery } from "../swagger/zod-openapi.js";
import { CreateOrderBodySchema, FindAllOrdersQuerySchema, OrderIdSchema, UpdateOrderBodySchema, type CreateOrderDto, type FindAllOrdersDto, type OrderIdDto, type UpdateOrderDto } from "./orders.dto.js";
import { OrderService } from "./orders.service.js";

@ApiTags('Pedidos')
@ApiProtected()
@Controller('orders')
export class OrdersController {
    constructor(private readonly orderService: OrderService) { }

    @Get()
    @ApiDoc({
        summary: 'Listar pedidos',
        ok: [OrderListResponseSchema, 'Pedidos encontrados. status e payment_method são enums.'],
    })
    async findAll(@ZodQuery(FindAllOrdersQuerySchema) query: FindAllOrdersDto) {
        const orders = await this.orderService.findAll(query)
        return { message: 'Pedidos encontrados com sucesso', orders }
    }

    @Get(':id')
    @ApiDoc({
        summary: 'Buscar pedido',
        ok: [OrderDetailResponseSchema, 'Pedido encontrado. status, payment_method e product_id dos itens são enums.'],
        notFound: 'Pedido não encontrado',
    })
    async findOne(@ZodParam('id', OrderIdSchema) id: OrderIdDto) {
        const order = await this.orderService.findOne(id)
        return { message: 'Pedido encontrado com sucesso', order }
    }

    @Post()
    @ApiDoc({
        summary: 'Criar pedido',
        description: 'O pedido é criado com status PENDING_DELIVERY.',
        created: CreatedOrderResponseSchema,
        badRequest: 'Body inválido ou estoque insuficiente',
        notFound: 'Cliente ou produto não encontrado',
    })
    async create(@ZodBody(CreateOrderBodySchema) body: CreateOrderDto) {
        const order = await this.orderService.create(body)
        return { message: 'Pedido criado com sucesso', order }
    }

    @Put(':id')
    @ApiDoc({
        summary: 'Atualizar pedido',
        ok: OrderDetailResponseSchema,
        badRequest: 'Body inválido ou estoque insuficiente',
        notFound: 'Pedido, cliente ou produto não encontrado',
    })
    async update(
        @ZodParam('id', OrderIdSchema) id: OrderIdDto,
        @ZodBody(UpdateOrderBodySchema) body: UpdateOrderDto
    ) {
        const order = await this.orderService.updateOne(id, body)
        return { message: 'Pedido atualizado com sucesso', order }
    }
}
