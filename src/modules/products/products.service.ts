import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "../../database/generated/prisma/client.js";
import { PrismaService } from "../../database/prisma.service.js";
import {
    CreateProductDto,
    ProductStockItemDto,
    StockMovementDto,
    UpdateProductDto,
} from "./products.dto.js";
import { Product } from "./products.entities.js";
import { ProductsRepository } from "./products.repository.js";

@Injectable()
export class ProductsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly productsRepository: ProductsRepository
    ) { }

    async findUnique(id: Product['id']) {
        const product = await this.productsRepository.findUnique(id)

        if (!product) {
            throw new NotFoundException('Produto não encontrado')
        }

        return product
    }

    async findAll() {
        const products = await this.productsRepository.findAll()
        return products
    }

    async create(data: CreateProductDto) {
        const productExists = await this.productsRepository.findByName(data.name)

        if (productExists) {
            throw new ConflictException('Já existe um produto com este nome')
        }

        const product = await this.productsRepository.create({
            name: data.name,
            stock: data.stock,
            unit_price: data.unit_price,
            promocional_price: data.promocional_price ?? null,
        })
        return product
    }

    async update(id: Product['id'], data: UpdateProductDto) {
        const productExists = await this.productsRepository.findUnique(id)

        if (!productExists) {
            throw new NotFoundException('Produto não encontrado')
        }

        const product = await this.productsRepository.update(id, data)
        return product
    }

    async delete(id: Product['id']) {
        const productExists = await this.productsRepository.findUnique(id)

        if (!productExists) {
            throw new NotFoundException('Produto não encontrado')
        }

        const product = await this.productsRepository.delete(id)
        return product
    }

    async removeStock(items: StockMovementDto[], tx?: Prisma.TransactionClient): Promise<ProductStockItemDto[]> {
        if (!tx) {
            return this.prisma.$transaction(tx => this.removeStock(items, tx))
        }

        const removedItems: ProductStockItemDto[] = []

        for (const { id, quantity } of this.mergeStockMovements(items)) {
            const removed = await this.productsRepository.decrementStock(id, quantity, tx)
            const product = await this.productsRepository.findUnique(id, tx)

            if (!product) {
                throw new NotFoundException('Produto não encontrado')
            }

            if (!removed) {
                throw new BadRequestException(`Estoque insuficiente para o produto ${product.name}`)
            }

            removedItems.push({ product, quantity })
        }

        return removedItems
    }

    async addStock(items: StockMovementDto[], tx?: Prisma.TransactionClient): Promise<void> {
        if (!tx) {
            return this.prisma.$transaction(tx => this.addStock(items, tx))
        }

        for (const { id, quantity } of this.mergeStockMovements(items)) {
            await this.productsRepository.incrementStock(id, quantity, tx)
        }
    }

    // Ordenar por id garante que transações concorrentes travem as linhas na mesma ordem, evitando deadlock
    private mergeStockMovements(items: StockMovementDto[]): StockMovementDto[] {
        const quantities = new Map<Product['id'], number>()

        for (const { id, quantity } of items) {
            quantities.set(id, (quantities.get(id) ?? 0) + quantity)
        }

        return [...quantities]
            .map(([id, quantity]) => ({ id, quantity }))
            .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    }
}
