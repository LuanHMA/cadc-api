import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service.js";
import { Customer } from "./customers.entities.js";

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
}