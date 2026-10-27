import { Body, Controller, Get, Param, Put } from "@nestjs/common";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe.js";
import { type FindUniqueProductParamsDto, FindUniqueProductParamsSchema, type StockBodyDto, StockBodySchema } from "./products.dto.js";
import { ProductsService } from "./products.service.js";

@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    @Get()
    async findAll() {
        const products = await this.productsService.findAll()
        return { message: 'Produtos encontrados com sucesso', products }
    }

    @Get(':id')
    async findUnique(@Param('id', new ZodValidationPipe(FindUniqueProductParamsSchema)) productId: FindUniqueProductParamsDto) {
        const product = await this.productsService.findUnique(productId)
        return { message: 'Produto encontrado com sucesso', product }
    }

    @Put('update-stock')
    async updateStock(
        @Body(new ZodValidationPipe(StockBodySchema)) body: StockBodyDto,
    ) {
        const products = await this.productsService.updateStock(body)

        return { message: 'Estoque atualizado com sucesso', products }
    }
}