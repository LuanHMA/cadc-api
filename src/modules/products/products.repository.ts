import { Injectable } from "@nestjs/common";
import { Prisma } from "../../database/generated/prisma/client.js";
import { PrismaService } from "../../database/prisma.service.js";
import { Product } from "./products.entities.js";

type UpdateProductData = Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>
type ProductRecord = Prisma.ProductGetPayload<{}>

@Injectable()
export class ProductsRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findAll() {
        const products = await this.prisma.product.findMany()
        return products
    }

    async findUnique(id: Product['id'], tx: Prisma.TransactionClient = this.prisma): Promise<Product | null> {
        const product = await tx.product.findUnique({
            where: {
                id,
            },
        })

        if (!product) {
            return null
        }

        return this.toEntity(product)
    }

    async update(id: Product['id'], data: UpdateProductData): Promise<Product> {
        const product = await this.prisma.product.update({
            where: {
                id,
            },
            data,
        })

        return this.toEntity(product)
    }

    async decrementStock(id: Product['id'], quantity: number, tx: Prisma.TransactionClient = this.prisma): Promise<boolean> {
        const { count } = await tx.product.updateMany({
            where: {
                id,
                stock: { gte: quantity },
            },
            data: {
                stock: { decrement: quantity },
            },
        })

        return count > 0
    }

    async incrementStock(id: Product['id'], quantity: number, tx: Prisma.TransactionClient = this.prisma): Promise<void> {
        await tx.product.update({
            where: {
                id,
            },
            data: {
                stock: { increment: quantity },
            },
        })
    }

    private toEntity(product: ProductRecord): Product {
        return {
            id: product.id,
            name: product.name,
            stock: product.stock,
            unit_price: product.unit_price.toNumber(),
            promocional_price: product.promocional_price?.toNumber() ?? null,
            created_at: product.created_at,
            updated_at: product.updated_at,
        }
    }
}
