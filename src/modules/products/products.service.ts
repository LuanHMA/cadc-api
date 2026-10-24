import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "../../database/generated/prisma/client.js";
import { PrismaService } from "../../database/prisma.service.js";
import {
    ProductStockItemDto,
    StockMovementDto,
    UpdateProductDto,
} from "./products.dto.js";
import { Product } from "./products.entities.js";
import { ProductsRepository } from "./products.repository.js";

const KIT_COMPOSITION: StockMovementDto[] = [
    { id: "TABLE", quantity: 1 },
    { id: "CHAIR", quantity: 4 },
]

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

    async update(id: Product['id'], data: UpdateProductDto) {
        const productExists = await this.productsRepository.findUnique(id)

        if (!productExists) {
            throw new NotFoundException('Produto não encontrado')
        }

        const product = await this.productsRepository.update(id, data)
        return product
    }

    async removeStock(items: StockMovementDto[], tx?: Prisma.TransactionClient): Promise<ProductStockItemDto[]> {
        if (!tx) {
            return this.prisma.$transaction(tx => this.removeStock(items, tx))
        }

        for (const { id, quantity } of this.toStockMovements(items)) {
            const removed = await this.productsRepository.decrementStock(id, quantity, tx)

            if (!removed) {
                const product = await this.productsRepository.findUnique(id, tx)
                throw new BadRequestException(`Estoque insuficiente para o produto ${product?.name ?? id}`)
            }
        }

        const removedItems: ProductStockItemDto[] = []

        for (const { id, quantity } of items) {
            const product = await this.productsRepository.findUnique(id, tx)

            if (!product) {
                throw new NotFoundException('Produto não encontrado')
            }

            removedItems.push({ product, quantity })
        }

        return removedItems
    }

    async addStock(items: StockMovementDto[], tx?: Prisma.TransactionClient): Promise<void> {
        if (!tx) {
            return this.prisma.$transaction(tx => this.addStock(items, tx))
        }

        for (const { id, quantity } of this.toStockMovements(items)) {
            await this.productsRepository.incrementStock(id, quantity, tx)
        }
    }

    // O kit não tem estoque próprio: movimenta o estoque das mesas e cadeiras que o compõem
    private toStockMovements(items: StockMovementDto[]): StockMovementDto[] {
        return items.flatMap(({ id, quantity }) =>
            id === "KIT"
                ? KIT_COMPOSITION.map(component => ({ id: component.id, quantity: component.quantity * quantity }))
                : [{ id, quantity }]
        )
    }
}
