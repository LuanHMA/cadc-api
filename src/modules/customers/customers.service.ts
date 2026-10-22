import { Injectable, NotFoundException } from "@nestjs/common";
import { Customer } from "./customers.entities.js";
import { CustomersRepository } from "./customers.repository.js";

@Injectable()
export class CustomersService {
    constructor(private readonly customersRepository: CustomersRepository) {}

    async findUnique(id: Customer['id']){
        const customer = await this.customersRepository.findUnique(id)

        if(!customer){
            throw new NotFoundException('Cliente não encontrado')
        }

        return customer
    }
}