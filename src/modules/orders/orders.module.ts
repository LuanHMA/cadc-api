import { Module } from "@nestjs/common";
import { CustomersModule } from "../customers/customers.module.js";
import { ProductsModule } from "../products/products.module.js";
import { OrdersController } from "./orders.controller.js";
import { OrdersRepository } from "./orders.repository.js";
import { OrderService } from "./orders.service.js";

@Module({
    imports: [CustomersModule, ProductsModule],
    controllers: [OrdersController],
    providers: [OrderService, OrdersRepository],
})

export class OrdersModule { }
