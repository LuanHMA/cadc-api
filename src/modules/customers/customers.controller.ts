import { Body, Controller, Delete, Get, Param, Post, Put, Query } from "@nestjs/common";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe.js";
import { CreateCustomerBodySchema, CustomerIdSchema, FindAllCustomersQuerySchema, UpdateCustomerBodySchema, type CreateCustomerDto, type CustomerIdDto, type FindAllCustomersDto, type UpdateCustomerDto } from "./customers.dto.js";
import { CustomersService } from "./customers.service.js";

@Controller('customers')
export class CustomersController {
    constructor(private readonly customersService: CustomersService) { }

    @Get()
    async findAll(@Query(new ZodValidationPipe(FindAllCustomersQuerySchema)) query: FindAllCustomersDto) {
        const { customers, pagination } = await this.customersService.findAll(query)
        return { message: 'Clientes encontrados com sucesso', customers, pagination }
    }

    @Post()
    async create(@Body(new ZodValidationPipe(CreateCustomerBodySchema)) body: CreateCustomerDto) {
        const customer = await this.customersService.create(body)
        return { message: 'Cliente criado com sucesso', customer }
    }

    @Put(':id')
    async update(
        @Param(new ZodValidationPipe(CustomerIdSchema)) params: CustomerIdDto,
        @Body(new ZodValidationPipe(UpdateCustomerBodySchema)) body: UpdateCustomerDto
    ) {
        const customer = await this.customersService.update(params.id, body)
        return { message: 'Cliente atualizado com sucesso', customer }
    }

    @Delete(':id')
    async delete(@Param(new ZodValidationPipe(CustomerIdSchema)) params: CustomerIdDto) {
        const customer = await this.customersService.delete(params.id)
        return { message: `${customer.name} deletado com sucesso` }
    }
}
