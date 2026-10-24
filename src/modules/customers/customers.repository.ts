import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service.js";
import { Customer } from "./customers.entities.js";

type CreateCustomerData = Omit<Customer, 'id' | 'created_at' | 'updated_at'>
type UpdateCustomerData = Partial<CreateCustomerData>

@Injectable()
export class CustomersRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findUnique(id: Customer['id']) {
        const customer = await this.prisma.customer.findUnique({
            where: {
                id,
            },
        })

        return customer
    }

    async findByPhone(phone: Customer['phone']) {
        const customer = await this.prisma.customer.findUnique({
            where: {
                phone,
            },
        })

        return customer
    }

    async findAll() {
        const customers = await this.prisma.customer.findMany()
        return customers
    }

    async create(data: CreateCustomerData) {
        const customer = await this.prisma.customer.create({
            data,
        })

        return customer
    }

    async update(id: Customer['id'], data: UpdateCustomerData) {
        const customer = await this.prisma.customer.update({
            where: {
                id,
            },
            data,
        })

        return customer
    }

    async delete(id: Customer['id']) {
        const customer = await this.prisma.customer.delete({
            where: {
                id,
            },
        })

        return customer
    }

}