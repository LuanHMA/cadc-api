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

        return this.prisma.$transaction(async (tx) => {
            if (id === "KIT" && data.stock !== undefined) {
                await this.ensureKitStockAvailable(data.stock, tx)
            }

            const { stock, ...prices } = data
            let product = await this.productsRepository.findUnique(id, tx)

            if (!product) {
                throw new NotFoundException('Produto não encontrado')
            }

            if (stock !== undefined) {
                product = await this.applyTotalStock(id, stock, tx)
            }

            if (Object.keys(prices).length > 0) {
                product = await this.productsRepository.update(id, prices, tx)
            }

            if (id === "KIT") {
                return [product]
            }

            const kit = await this.refreshKitStock(tx)
            return [product, kit]
        })
    }

    async updateStock(data: StockBodyDto) {
        const components: UpdateKitStockDto[] = [data.tables, data.chairs]

        return this.prisma.$transaction(async (tx) => {
            const updatedProducts = []

            for (const { id, quantity } of components) {
                updatedProducts.push(await this.applyTotalStock(id, quantity, tx))
            }

            updatedProducts.push(await this.refreshKitStock(tx))

            return updatedProducts
        })
    }

    async removeStock(items: StockMovementDto[], tx?: Prisma.TransactionClient): Promise<ProductStockItemDto[]> {
        if (!tx) {
            return this.prisma.$transaction(tx => this.removeStock(items, tx))
        }

        // Remove o estoque de todos os produtos - Utilize o método expandKitToComponents para identificar quantas mesas e cadeiras devem ser removidas caso seja um KIT
        for (const { id, quantity } of this.expandKitToComponents(items)) {
            const removed = await this.productsRepository.decrementDisponibleStock(id, quantity, tx)

            if (!removed) {
                const product = await this.productsRepository.findUnique(id, tx)
                throw new BadRequestException(`Estoque insuficiente para o produto ${product?.name ?? id}`)
            }
        }

        await this.refreshKitStock(tx)

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

        for (const { id, quantity } of this.expandKitToComponents(items)) {
            await this.productsRepository.incrementDisponibleStock(id, quantity, tx)
        }

        await this.refreshKitStock(tx)
    }

    // Garante que a quantidade de kits cabe nas mesas e cadeiras disponíveis (1 mesa e 4 cadeiras por kit)
    private async ensureKitStockAvailable(kitQuantity: number, tx: Prisma.TransactionClient) {
        const [tables, chairs] = await Promise.all([
            this.productsRepository.findUnique("TABLE", tx),
            this.productsRepository.findUnique("CHAIR", tx),
        ])

        if (!tables || !chairs) {
            throw new NotFoundException('Produto não encontrado')
        }

        const availableKits = this.countCompleteKits([
            { id: "TABLE", quantity: tables.stock },
            { id: "CHAIR", quantity: chairs.stock },
        ])

        if (kitQuantity > availableKits) {
            throw new BadRequestException('Não há mesas ou cadeiras suficientes no estoque')
        }
    }

    // Atualiza o estoque do KIT com base no estoque das mesas e cadeiras
    private async refreshKitStock(tx: Prisma.TransactionClient) {
        const [tables, chairs] = await Promise.all([
            this.productsRepository.findUnique("TABLE", tx),
            this.productsRepository.findUnique("CHAIR", tx),
        ])

        if (!tables || !chairs) {
            throw new NotFoundException('Produto não encontrado')
        }

        const kitStock = this.countCompleteKits([
            { id: "TABLE", quantity: tables.stock },
            { id: "CHAIR", quantity: chairs.stock },
        ])

        const kitDisponibleStock = this.countCompleteKits([
            { id: "TABLE", quantity: tables.disponible_stock },
            { id: "CHAIR", quantity: chairs.disponible_stock },
        ])

        return this.productsRepository.setQuantities("KIT", {
            stock: kitStock,
            disponible_stock: kitDisponibleStock,
        }, tx)
    }

    private async applyTotalStock(id: Product['id'], stock: number, tx: Prisma.TransactionClient) {
        const current = await this.productsRepository.findUnique(id, tx)

        if (!current) {
            throw new NotFoundException('Produto não encontrado')
        }

        const rented = current.stock - current.disponible_stock

        if (stock < rented) {
            throw new BadRequestException('O estoque total não pode ser menor que a quantidade alugada')
        }

        return this.productsRepository.setQuantities(id, {
            stock,
            disponible_stock: stock - rented,
        }, tx)
    }

    // Se for um KIT, converte o kit para o numero de mesas e cadeiras que o compõem, se não retorna os itens originais
    private expandKitToComponents(items: StockMovementDto[]): StockMovementDto[] {
        return items.flatMap(({ id, quantity }) => {
            if (id === "KIT") {
                return KIT_COMPOSITION.map(component => ({ id: component.id, quantity: component.quantity * quantity }))
            }

            return [{ id, quantity }]
        })
    }

    // Calcula o número de kits completos que podem ser formados com os produtos disponíveis
    private countCompleteKits(products: UpdateKitStockDto[]) {
        const stockById = new Map(products.map(({ id, quantity }) => [id, quantity]))

        return Math.min(
            ...KIT_COMPOSITION.map(({ id, quantity }) =>
                Math.floor((stockById.get(id) ?? 0) / quantity)
            ),
        )
    }
}
