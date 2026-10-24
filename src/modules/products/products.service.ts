import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { CreateProductDto, UpdateProductDto } from "./products.dto.js";
import { Product } from "./products.entities.js";
import { ProductsRepository } from "./products.repository.js";

@Injectable()
export class ProductsService {
    constructor(private readonly productsRepository: ProductsRepository) { }

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
}