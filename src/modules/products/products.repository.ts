import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service.js";
import { Product } from "./products.entities.js";

@Injectable()
export class ProductsRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findUnique(id: Product['id']){
        const product = await this.prisma.product.findUnique({
            where: {
                id,
            },
        })

        return product
    }
}