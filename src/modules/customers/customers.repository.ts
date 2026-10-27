import { Injectable } from "@nestjs/common";
import { Prisma } from "../../database/generated/prisma/client.js";
import { PrismaService } from "../../database/prisma.service.js";
import { FindAllCustomersDto } from "./customers.dto.js";
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

    async findAll({ page, limit, name, phone }: FindAllCustomersDto) {
        const where: Prisma.CustomerWhereInput = {
            ...(name ? { name: { contains: name, mode: "insensitive" } } : {}),
            ...(phone ? { phone: { contains: phone } } : {}),
        }

        const [customers, total] = await Promise.all([
            this.prisma.customer.findMany({
                where,
                orderBy: { name: "asc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.customer.count({ where }),
        ])

        return {
            customers,
            pagination: {
                page,
                limit,
                total,
                total_pages: Math.ceil(total / limit),
            },
        }
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