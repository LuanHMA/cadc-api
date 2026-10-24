import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service.js";
import { Product } from "./products.entities.js";

type CreateProductData = Omit<Product, 'id' | 'created_at' | 'updated_at'>
type UpdateProductData = Partial<CreateProductData>

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

    async findUnique(id: Product['id']): Promise<Product | null> {
        const product = await this.prisma.product.findUnique({
            where: {
                id,
            },
        })

        if (!product) {
            return null
        }

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

    async findByName(name: Product['name']): Promise<Product | null> {
        const product = await this.prisma.product.findUnique({
            where: {
                name,
            },
        })
        if (!product) {
            return null
        }

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

    async update(id: Product['id'], data: UpdateProductData): Promise<Product> {
        const product = await this.prisma.product.update({
            where: {
                id,
            },
            data,
        })

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


    async delete(id: Product['id']): Promise<Product> {
        const product = await this.prisma.product.delete({
            where: {
                id,
            },
        })
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