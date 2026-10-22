import { Injectable } from "@nestjs/common";
import { OrdersRepository } from "./orders.repository.js";

@Injectable()
export class OrderService {
    constructor(private readonly ordersRepository: OrdersRepository){}
    

}