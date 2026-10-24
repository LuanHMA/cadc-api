import { Injectable } from "@nestjs/common";
import { Prisma } from "../../database/generated/prisma/client.js";
import { PrismaService } from "../../database/prisma.service.js";
import { Product } from "./products.entities.js";

type CreateProductData = Omit<Product, 'id' | 'created_at' | 'updated_at'>
type UpdateProductData = Partial<CreateProductData>
type ProductRecord = Prisma.ProductGetPayload<{}>

@Injectable()
export class ProductsRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findAll() {
        const products = await this.prisma.product.findMany()
        return products
    }

    async create(data: CreateProductData): Promise<Product> {
        const product = await this.prisma.product.create({
            data,
        })

        return this.toEntity(product)
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

    async findByName(name: Product['name']): Promise<Product | null> {
        const product = await this.prisma.product.findUnique({
            where: {
                name,
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

    async delete(id: Product['id']): Promise<Product> {
        const product = await this.prisma.product.delete({
            where: {
                id,
            },
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
