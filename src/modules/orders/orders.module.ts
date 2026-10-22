import { Module } from "@nestjs/common";
import { OrdersController } from "./orders.controller.js";
import { OrderService } from "./orders.service.js";

@Module({
    imports: [],
    controllers: [OrdersController],
    providers: [OrderService],
})

export class OrdersModule {}