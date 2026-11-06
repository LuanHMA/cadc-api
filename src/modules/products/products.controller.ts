import { Body, Controller, Get, Param, Put } from "@nestjs/common";
import { ApiBadRequestResponse, ApiNotFoundResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe.js";
import { ProductItemResponseSchema, ProductListResponseSchema } from "../../swagger/response.schemas.js";
import { ApiProtected, ApiZodBody, ApiZodOkResponse, ApiZodParam } from "../../swagger/zod-openapi.js";
import { type ProductIdDto, ProductIdSchema, StockBodySchema, UpdateProductBodySchema, type UpdateProductDto } from "./products.dto.js";
import { ProductsService } from "./products.service.js";

@ApiTags('Produtos')
@ApiProtected()
@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    @Get()
    @ApiOperation({ summary: 'Listar produtos' })
    @ApiZodOkResponse(ProductListResponseSchema, 'Produtos encontrados. O id é um enum ProductType.')
    async findAll() {
        const products = await this.productsService.findAll()
        return { message: 'Produtos encontrados com sucesso', products }
    }

    @Get(':id')
    @ApiOperation({ summary: 'Buscar produto' })
    @ApiZodParam('id', ProductIdSchema)
    @ApiZodOkResponse(ProductItemResponseSchema, 'Produto encontrado.')
    @ApiNotFoundResponse({ description: 'Produto não encontrado' })
    async findUnique(@Param('id', new ZodValidationPipe(ProductIdSchema)) productId: ProductIdDto) {
        const product = await this.productsService.findUnique(productId)
        return { message: 'Produto encontrado com sucesso', product }
    }

    @Put(':id')
    @ApiOperation({
        summary: 'Atualizar estoque de mesas e cadeiras',
        description: 'O estoque do KIT é recalculado a partir das mesas e cadeiras (1 mesa e 4 cadeiras por kit).',
    })
    @ApiZodBody(StockBodySchema)
    @ApiZodOkResponse(ProductListResponseSchema, 'Estoque atualizado. A resposta inclui mesas, cadeiras e o kit.')
    @ApiBadRequestResponse({ description: 'Body inválido' })
    @ApiNotFoundResponse({ description: 'Produto não encontrado' })
    async update(
        @Body(new ZodValidationPipe(UpdateProductBodySchema)) body: UpdateProductDto,
        @Param('id', new ZodValidationPipe(ProductIdSchema)) productId: ProductIdDto,
    ) {
        console.log(productId)

        const products = await this.productsService.update(productId, body)

        return { message: 'Estoque atualizado com sucesso', products }
    }
}