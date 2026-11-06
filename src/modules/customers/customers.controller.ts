import { Body, Controller, Delete, Get, Param, Post, Put, Query } from "@nestjs/common";
import { ApiConflictResponse, ApiNotFoundResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe.js";
import { CustomerDetailResponseSchema, CustomerItemResponseSchema, CustomerListResponseSchema, MessageResponseSchema } from "../../swagger/response.schemas.js";
import { ApiProtected, ApiZodBody, ApiZodCreatedResponse, ApiZodOkResponse, ApiZodParam, ApiZodQuery } from "../../swagger/zod-openapi.js";
import { CreateCustomerBodySchema, CustomerIdSchema, FindAllCustomersQuerySchema, UpdateCustomerBodySchema, type CreateCustomerDto, type CustomerIdDto, type FindAllCustomersDto, type UpdateCustomerDto } from "./customers.dto.js";
import { CustomersService } from "./customers.service.js";

@ApiTags('Clientes')
@ApiProtected()
@Controller('customers')
export class CustomersController {
    constructor(private readonly customersService: CustomersService) { }

    @Get()
    @ApiOperation({ summary: 'Listar clientes' })
    @ApiZodQuery(FindAllCustomersQuerySchema)
    @ApiZodOkResponse(CustomerListResponseSchema, 'Clientes encontrados.')
    async findAll(@Query(new ZodValidationPipe(FindAllCustomersQuerySchema)) query: FindAllCustomersDto) {
        const { customers, pagination } = await this.customersService.findAll(query)
        return { message: 'Clientes encontrados com sucesso', customers, pagination }
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Buscar cliente',
        description: 'Retorna os dados do cliente, pedidos em andamento, pedidos concluídos e o total gasto em aluguéis.',
    })
    @ApiZodParam('id', CustomerIdSchema.shape.id)
    @ApiZodOkResponse(CustomerDetailResponseSchema, 'Cliente encontrado.')
    @ApiNotFoundResponse({ description: 'Cliente não encontrado' })
    async findOne(@Param(new ZodValidationPipe(CustomerIdSchema)) params: CustomerIdDto) {
        const customer = await this.customersService.findOne(params.id)
        return { message: 'Cliente encontrado com sucesso', customer }
    }

    @Post()
    @ApiOperation({
        summary: 'Criar cliente',
        description: 'O endereço é rua, número da casa, bairro e complemento opcional.',
    })
    @ApiZodBody(CreateCustomerBodySchema)
    @ApiZodCreatedResponse(CustomerItemResponseSchema, 'Cliente criado.')
    @ApiConflictResponse({ description: 'Já existe um cliente com este telefone' })
    async create(@Body(new ZodValidationPipe(CreateCustomerBodySchema)) body: CreateCustomerDto) {
        const customer = await this.customersService.create(body)
        return { message: 'Cliente criado com sucesso', customer }
    }

    @Put(':id')
    @ApiOperation({
        summary: 'Atualizar cliente',
        description: 'Rua, número da casa e bairro são obrigatórios. O complemento é opcional.',
    })
    @ApiZodParam('id', CustomerIdSchema.shape.id)
    @ApiZodBody(UpdateCustomerBodySchema)
    @ApiZodOkResponse(CustomerItemResponseSchema, 'Cliente atualizado.')
    @ApiNotFoundResponse({ description: 'Cliente não encontrado' })
    async update(
        @Param(new ZodValidationPipe(CustomerIdSchema)) params: CustomerIdDto,
        @Body(new ZodValidationPipe(UpdateCustomerBodySchema)) body: UpdateCustomerDto
    ) {
        const customer = await this.customersService.update(params.id, body)
        return { message: 'Cliente atualizado com sucesso', customer }
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Remover cliente' })
    @ApiZodParam('id', CustomerIdSchema.shape.id)
    @ApiZodOkResponse(MessageResponseSchema, 'Cliente removido.')
    @ApiNotFoundResponse({ description: 'Cliente não encontrado' })
    async delete(@Param(new ZodValidationPipe(CustomerIdSchema)) params: CustomerIdDto) {
        const customer = await this.customersService.delete(params.id)
        return { message: `${customer.name} deletado com sucesso` }
    }
}
