import { Controller } from "@nestjs/common";
import { OrderService } from "./orders.service.js";

@Controller('orders')
export class OrdersController {
    constructor(private readonly orderService: OrderService){}
}