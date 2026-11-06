import { Controller, Delete, Get, Post, Put } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CustomerDetailResponseSchema, CustomerItemResponseSchema, CustomerListResponseSchema, MessageResponseSchema } from "../swagger/response.schemas.js";
import { ApiDoc, ApiProtected, ZodBody, ZodParam, ZodQuery } from "../swagger/zod-openapi.js";
import { CreateCustomerBodySchema, CustomerIdSchema, FindAllCustomersQuerySchema, UpdateCustomerBodySchema, type CreateCustomerDto, type CustomerIdDto, type FindAllCustomersDto, type UpdateCustomerDto } from "./customers.dto.js";
import { CustomersService } from "./customers.service.js";

@ApiTags('Clientes')
@ApiProtected()
@Controller('customers')
export class CustomersController {
    constructor(private readonly customersService: CustomersService) { }

    @Get()
    @ApiDoc({ summary: 'Listar clientes', ok: CustomerListResponseSchema })
    async findAll(@ZodQuery(FindAllCustomersQuerySchema) query: FindAllCustomersDto) {
        const { customers, pagination } = await this.customersService.findAll(query)
        return { message: 'Clientes encontrados com sucesso', customers, pagination }
    }

    @Get(':id')
    @ApiDoc({
        summary: 'Buscar cliente',
        description: 'Retorna os dados do cliente, pedidos em andamento, pedidos concluídos e o total gasto em aluguéis.',
        ok: CustomerDetailResponseSchema,
        notFound: 'Cliente não encontrado',
    })
    async findOne(@ZodParam(CustomerIdSchema) params: CustomerIdDto) {
        const customer = await this.customersService.findOne(params.id)
        return { message: 'Cliente encontrado com sucesso', customer }
    }

    @Post()
    @ApiDoc({
        summary: 'Criar cliente',
        description: 'O endereço é rua, número da casa, bairro e complemento opcional.',
        created: CustomerItemResponseSchema,
        conflict: 'Já existe um cliente com este telefone',
    })
    async create(@ZodBody(CreateCustomerBodySchema) body: CreateCustomerDto) {
        const customer = await this.customersService.create(body)
        return { message: 'Cliente criado com sucesso', customer }
    }

    @Put(':id')
    @ApiDoc({
        summary: 'Atualizar cliente',
        description: 'Rua, número da casa e bairro são obrigatórios. O complemento é opcional.',
        ok: CustomerItemResponseSchema,
        notFound: 'Cliente não encontrado',
    })
    async update(
        @ZodParam(CustomerIdSchema) params: CustomerIdDto,
        @ZodBody(UpdateCustomerBodySchema) body: UpdateCustomerDto
    ) {
        const customer = await this.customersService.update(params.id, body)
        return { message: 'Cliente atualizado com sucesso', customer }
    }

    @Delete(':id')
    @ApiDoc({
        summary: 'Remover cliente',
        ok: MessageResponseSchema,
        notFound: 'Cliente não encontrado',
    })
    async delete(@ZodParam(CustomerIdSchema) params: CustomerIdDto) {
        const customer = await this.customersService.delete(params.id)
        return { message: `${customer.name} deletado com sucesso` }
    }
}
