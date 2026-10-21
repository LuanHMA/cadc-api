import { PrismaService } from "../../database/prisma.service.js";
import { User } from "./users.entities.js";

export type CreateUserInput = {
    email: string
    password_hash: string
    name: string
}

export type UpdateUserInput = {
    password_hash?: string
    name?: string
}

export class UsersRepository {
    constructor(private readonly prisma: PrismaService){}

    async findByEmail(email: User['email']): Promise<User | null>{
        return this.prisma.user.findUnique({
            where: {
                email
            }
        })
    }

    async create(data: CreateUserInput): Promise<User>{
        return this.prisma.user.create({
            data: {
                email: data.email,
                password_hash: data.password_hash,
                name: data.name,
            }
        })
    }

    async update(id: User['id'], data: UpdateUserInput): Promise<User>{
        return this.prisma.user.update({
            where: {
                id
            },
            data: {
                password_hash: data.password_hash,
                name: data.name,
            }
        })
    }

    async delete(id: User['id']): Promise<void>{
        await this.prisma.user.delete({
            where: {
                id
            }
        })
    }
}