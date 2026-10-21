import { ConflictException, Injectable } from '@nestjs/common';
import { UsersRepository } from './../users/users.repository.js';
import { type LoginDto } from './dtos/login.dto.js';
import { RegisterDto, RegisterResponseDto } from './dtos/register.dto.js';
import { BcryptService } from './hashing/bcrypt.service.js';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersRepository: UsersRepository,
        private readonly bcryptService: BcryptService,
    ) { }

    async login(data: LoginDto) {
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

        const hashedPassword = await this.bcryptService.hash(data.password)

        const user = await this.usersRepository.create({
            email: data.email,
            password_hash: hashedPassword,
            name: data.name,
        })

        //Gerar token JWT        

        return {
            accessToken: 'accessToken',
            refreshToken: 'refreshToken',
        };
    }
}
