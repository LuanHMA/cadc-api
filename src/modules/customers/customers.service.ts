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

    async findAll(query: FindAllCustomersDto) {
        return this.customersRepository.findAll(query)
    }

    async create(data: CreateCustomerDto) {
        const customerExists = await this.customersRepository.findByPhone(data.phone)

        if (customerExists) {
            throw new ConflictException('Já existe um cliente com este telefone')
        }
        const customer = await this.customersRepository.create({
            address: data.address,
            district: data.district,
            name: data.name,
            phone: data.phone,
            reference_point: data.reference_point ?? null,
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
