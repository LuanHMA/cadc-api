import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "../../database/generated/prisma/client.js";
import { PrismaService } from "../../database/prisma.service.js";
import {
    ProductStockItemDto,
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
        // O estoque do KIT é sempre derivado das mesas e cadeiras (ver refreshKitStock)
        if (id === "KIT" && data.stock !== undefined) {
            throw new BadRequestException('O estoque do KIT é calculado a partir das mesas e cadeiras')
        }

        return this.prisma.$transaction(async (tx) => {
            const { stock, ...prices } = data
            let product = await this.productsRepository.findUnique(id, tx)

            if (!product) {
                throw new NotFoundException('Produto não encontrado')
            }

            if (stock !== undefined) {
                product = await this.applyTotalStock(product, stock, tx)
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

    // Recebe os items no formato (product_id e quantity), converet kit para mesas e cadeiras, remove os items do estoque disponivel e retorna um array com os produtos removidos (informação do produto e quantidade)
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

        return this.loadStockItems(items, tx)
    }

    // Carrega os produtos dos itens (com preço atual) sem movimentar o estoque
    async loadStockItems(items: StockMovementDto[], tx?: Prisma.TransactionClient): Promise<ProductStockItemDto[]> {
        const stockItems: ProductStockItemDto[] = []

        for (const { id, quantity } of items) {
            const product = await this.productsRepository.findUnique(id, tx)

            if (!product) {
                throw new NotFoundException('Produto não encontrado')
            }

            stockItems.push({ product, quantity })
        }

        return stockItems
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

    private async applyTotalStock(current: Product, stock: number, tx: Prisma.TransactionClient) {
        const rented = current.stock - current.disponible_stock

        if (stock < rented) {
            throw new BadRequestException('O estoque total não pode ser menor que a quantidade alugada')
        }

        return this.productsRepository.setQuantities(current.id, {
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
