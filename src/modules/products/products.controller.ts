import { Controller, Get, Put } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ProductItemResponseSchema, ProductListResponseSchema } from "../swagger/response.schemas.js";
import { ApiDoc, ApiProtected, ZodBody, ZodParam } from "../swagger/zod-openapi.js";
import { type ProductIdDto, ProductIdSchema, UpdateProductBodySchema, type UpdateProductDto } from "./products.dto.js";
import { ProductsService } from "./products.service.js";

@ApiTags('Produtos')
@ApiProtected()
@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    @Get()
    @ApiDoc({
        summary: 'Listar produtos',
        ok: [ProductListResponseSchema, 'Produtos encontrados. O id é um enum ProductType.'],
    })
    async findAll() {
        const products = await this.productsService.findAll()
        return { message: 'Produtos encontrados com sucesso', products }
    }

    @Get(':id')
    @ApiDoc({
        summary: 'Buscar produto',
        ok: ProductItemResponseSchema,
        notFound: 'Produto não encontrado',
    })
    async findUnique(@ZodParam('id', ProductIdSchema) productId: ProductIdDto) {
        const product = await this.productsService.findUnique(productId)
        return { message: 'Produto encontrado com sucesso', product }
    }

    @Put(':id')
    @ApiDoc({
        summary: 'Atualizar estoque de mesas e cadeiras',
        description: 'O estoque do KIT é recalculado a partir das mesas e cadeiras (1 mesa e 4 cadeiras por kit).',
        ok: [ProductListResponseSchema, 'Estoque atualizado. A resposta inclui mesas, cadeiras e o kit.'],
        badRequest: 'Body inválido ou tentativa de alterar o estoque do KIT',
        notFound: 'Produto não encontrado',
    })
    async update(
        @ZodBody(UpdateProductBodySchema) body: UpdateProductDto,
        @ZodParam('id', ProductIdSchema) productId: ProductIdDto,
    ) {
        console.log(productId)

        const products = await this.productsService.update(productId, body)

        return { message: 'Estoque atualizado com sucesso', products }
    }
}
