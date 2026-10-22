import { Injectable, NotFoundException } from "@nestjs/common";
import { Product } from "./products.entities.js";
import { ProductsRepository } from "./products.repository.js";

@Injectable()
export class ProductsService {
    constructor(private readonly productsRepository: ProductsRepository) {}

    async findUnique(id: Product['id']){
        const product = await this.productsRepository.findUnique(id)

        if(!product){
            throw new NotFoundException('Produto não encontrado')
        }

        return product
    }
}