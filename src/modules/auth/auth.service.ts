import { ConflictException, Injectable } from '@nestjs/common';
import { Bcrypt } from './../../common/crypto/bcrypt.js';
import { UsersRepository } from './../users/users.repository.js';
import { type LoginDto } from './dtos/login.dto.js';
import { RegisterDto, RegisterResponseDto } from './dtos/register.dto.js';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersRepository: UsersRepository,
        private readonly bcrypt: Bcrypt,
    ) { }

    async login(data: LoginDto) {
        // Validar e-mail e senha
        // Gerar token JWT
        // Gerar sid
        // Retornar token JWT
        return {
            accessToken: 'accessToken',
            refreshToken: 'refreshToken',
        };
    }

    async register(data: RegisterDto): Promise<RegisterResponseDto> {
        const existingUser = await this.usersRepository.findByEmail(data.email)

        if(existingUser){
            throw new ConflictException('E-mail já está em uso')
        }

        const hashedPassword = await this.bcrypt.hash(data.password)

        const user = await this.usersRepository.create({
            email: data.email,
            password_hash: hashedPassword,
            name: data.name,
        })

        //Gerar token JWT        
        // Retornar token JWT

        return {
            accessToken: 'accessToken',
            refreshToken: 'refreshToken',
        };
    }
}
