import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { CreateCustomerDto, FindAllCustomersDto, UpdateCustomerDto } from "./customers.dto.js";
import { Customer } from "./customers.entities.js";
import { CustomersRepository } from "./customers.repository.js";

@Injectable()
export class CustomersService {
    constructor(private readonly customersRepository: CustomersRepository) { }

    async findUnique(id: Customer['id']) {
        const customer = await this.customersRepository.findUnique(id)

        if (!customer) {
            throw new NotFoundException('Cliente não encontrado')
        }

        return customer
    }

    async findOne(id: Customer['id']) {
        const customer = await this.customersRepository.findDetails(id)

        if (!customer) {
            throw new NotFoundException('Cliente não encontrado')
        }

        return customer
    }

    async findAll(query: FindAllCustomersDto) {
        return this.customersRepository.findAll(query)
    }

    async create(data: CreateCustomerDto) {
        const customerExists = await this.customersRepository.findByPhone(data.phone)

        if (customerExists) {
            throw new ConflictException('Já existe um cliente com este telefone')
        }
        const customer = await this.customersRepository.create({
            name: data.name,
            phone: data.phone,
            street: data.street,
            house_number: data.house_number,
            complement: data.complement ?? null,
            district: data.district,
        })

        return customer
    }

    async update(id: Customer['id'], data: UpdateCustomerDto) {
        const customerExists = await this.customersRepository.findUnique(id)

        if (!customerExists) {
            throw new NotFoundException('Cliente não encontrado')
        }

        const customer = await this.customersRepository.update(id, data)

        return customer
    }

    async delete(id: Customer['id']) {
        const customerExists = await this.customersRepository.findUnique(id)

        if (!customerExists) {
            throw new NotFoundException('Cliente não encontrado')
        }

        const customer = await this.customersRepository.delete(id)
        return customer
    }
}
