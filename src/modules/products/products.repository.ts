import { Injectable } from "@nestjs/common";
import { Prisma } from "../../database/generated/prisma/client.js";
import { PrismaService } from "../../database/prisma.service.js";
import { Product } from "./products.entities.js";

type UpdateProductData = Partial<Omit<Product, 'id' | 'created_at' | 'updated_at' | 'name'>>
type ProductRecord = Prisma.ProductGetPayload<{}>

@Injectable()
export class ProductsRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findAll() {
        const products = await this.prisma.product.findMany({
            orderBy: {
                name: 'asc'
            }
        })
        return products.map(this.toEntity)
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

    async setQuantities(
        id: Product['id'],
        quantities: Pick<Product, 'stock' | 'disponible_stock'>,
        tx: Prisma.TransactionClient = this.prisma,
    ): Promise<Product> {
        const product = await tx.product.update({
            where: { id },
            data: quantities,
        })

        return this.toEntity(product)
    }

    async update(id: Product['id'], data: UpdateProductData, tx: Prisma.TransactionClient = this.prisma): Promise<Product> {
        const product = await tx.product.update({
            where: {
                id,
            },
            data,
        })

        return this.toEntity(product)
    }

    async decrementDisponibleStock(id: Product['id'], quantity: number, tx: Prisma.TransactionClient = this.prisma): Promise<boolean> {
        const { count } = await tx.product.updateMany({
            where: {
                id,
                disponible_stock: { gte: quantity },
            },
            data: {
                disponible_stock: { decrement: quantity },
            },
        })

        return count > 0
    }

    async incrementDisponibleStock(id: Product['id'], quantity: number, tx: Prisma.TransactionClient = this.prisma): Promise<void> {
        await tx.product.update({
            where: { id },
            data: {
                disponible_stock: { increment: quantity },
            },
        })
    }

    private toEntity(product: ProductRecord): Product {
        return {
            id: product.id,
            name: product.name,
            stock: product.stock,
            disponible_stock: product.disponible_stock,
            unit_price: product.unit_price.toNumber(),
            promocional_price: product.promocional_price?.toNumber() ?? null,
            created_at: product.created_at,
            updated_at: product.updated_at,
        }
    }
}
