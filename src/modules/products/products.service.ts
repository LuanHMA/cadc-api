import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "../../database/generated/prisma/client.js";
import { PrismaService } from "../../database/prisma.service.js";
import {
    ProductStockItemDto,
    StockBodyDto,
    StockMovementDto,
    UpdateKitStockDto,
    UpdateProductDto,
} from "./products.dto.js";
import { Product } from "./products.entities.js";
import { ProductsRepository } from "./products.repository.js";

const KIT_COMPOSITION: UpdateKitStockDto[] = [
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

    async updateStock(data: StockBodyDto) {
        const components: UpdateKitStockDto[] = [data.tables, data.chairs]
        const kitStock = this.updateKitStock(components)

        return this.prisma.$transaction(async (tx) => {
            const updatedProducts = []

            for (const { id, quantity } of components) {
                updatedProducts.push(await this.productsRepository.setStock(id, quantity, tx))
            }

            updatedProducts.push(await this.productsRepository.setStock("KIT", kitStock, tx))

            return updatedProducts
        })
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

    // Se for um KIT, converte o kit para o numero de mesas e cadeiras que o compõem
    private toStockMovements(items: StockMovementDto[]): StockMovementDto[] {
        return items.flatMap(({ id, quantity }) => {
            if (id === "KIT") {
                return KIT_COMPOSITION.map(component => ({ id: component.id, quantity: component.quantity * quantity }))
            }
            return [{ id, quantity }]
        })
    }

    // 1 kit = 1 mesa + 4 cadeiras. O estoque do kit é o menor número de kits completos.
    private updateKitStock(products: UpdateKitStockDto[]) {
        const stockById = new Map(products.map(({ id, quantity }) => [id, quantity]))

        return Math.min(
            ...KIT_COMPOSITION.map(({ id, quantity }) =>
                Math.floor((stockById.get(id) ?? 0) / quantity)
            ),
        )
    }
}
