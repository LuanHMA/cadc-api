import { Controller, Get, Query } from "@nestjs/common";
import { type FindAllOrdersDto } from "./orders.dto.js";
import { OrderService } from "./orders.service.js";

@Controller('orders')
export class OrdersController {
    constructor(private readonly orderService: OrderService) { }

    @Get()
    async findAll(@Query() query: FindAllOrdersDto) {
        return this.orderService.findAll(query)
    }
}