import { Body, Controller, Get, Param, Post, Put, Query } from "@nestjs/common";
import { ApiBadRequestResponse, ApiNotFoundResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe.js";
import { CreatedOrderResponseSchema, OrderDetailResponseSchema, OrderListResponseSchema } from "../../swagger/response.schemas.js";
import { ApiProtected, ApiZodBody, ApiZodCreatedResponse, ApiZodOkResponse, ApiZodParam, ApiZodQuery } from "../../swagger/zod-openapi.js";
import { CreateOrderBodySchema, FindAllOrdersQuerySchema, OrderIdSchema, UpdateOrderBodySchema, type CreateOrderDto, type FindAllOrdersDto, type OrderIdDto, type UpdateOrderDto } from "./orders.dto.js";
import { OrderService } from "./orders.service.js";

@ApiTags('Pedidos')
@ApiProtected()
@Controller('orders')
export class OrdersController {
    constructor(private readonly orderService: OrderService) { }

    @Get()
    @ApiOperation({ summary: 'Listar pedidos' })
    @ApiZodQuery(FindAllOrdersQuerySchema)
    @ApiZodOkResponse(OrderListResponseSchema, 'Pedidos encontrados. status e payment_method são enums.')
    async findAll(@Query() query: FindAllOrdersDto) {
        const orders = await this.orderService.findAll(query)
        return { message: 'Pedidos encontrados com sucesso', orders }
    }

    @Get(':id')
    @ApiOperation({ summary: 'Buscar pedido' })
    @ApiZodParam('id', OrderIdSchema)
    @ApiZodOkResponse(OrderDetailResponseSchema, 'Pedido encontrado. status, payment_method e product_id dos itens são enums.')
    @ApiNotFoundResponse({ description: 'Pedido não encontrado' })
    async findOne(@Param('id', new ZodValidationPipe(OrderIdSchema)) id: OrderIdDto) {
        const order = await this.orderService.findOne(id)
        return { message: 'Pedido encontrado com sucesso', order }
    }

    @Post()
    @ApiOperation({ summary: 'Criar pedido', description: 'O pedido é criado com status PENDING_DELIVERY.' })
    @ApiZodBody(CreateOrderBodySchema)
    @ApiZodCreatedResponse(CreatedOrderResponseSchema, 'Pedido criado.')
    @ApiBadRequestResponse({ description: 'Body inválido ou estoque insuficiente' })
    @ApiNotFoundResponse({ description: 'Cliente ou produto não encontrado' })
    async create(@Body(new ZodValidationPipe(CreateOrderBodySchema)) body: CreateOrderDto) {
        const order = await this.orderService.create(body)
        return { message: 'Pedido criado com sucesso', order }
    }

    @Put(':id')
    @ApiOperation({ summary: 'Atualizar pedido' })
    @ApiZodParam('id', OrderIdSchema)
    @ApiZodBody(UpdateOrderBodySchema)
    @ApiZodOkResponse(OrderDetailResponseSchema, 'Pedido atualizado.')
    @ApiBadRequestResponse({ description: 'Body inválido ou estoque insuficiente' })
    @ApiNotFoundResponse({ description: 'Pedido, cliente ou produto não encontrado' })
    async update(
        @Param('id', new ZodValidationPipe(OrderIdSchema)) id: OrderIdDto,
        @Body(new ZodValidationPipe(UpdateOrderBodySchema)) body: UpdateOrderDto
    ) {
        const order = await this.orderService.updateOne(id, body)
        return { message: 'Pedido atualizado com sucesso', order }
    }
}