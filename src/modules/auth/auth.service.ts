import { ConflictException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Session } from '../session/session.entities.js';
import { SessionService } from '../session/session.service.js';
import { User } from '../users/users.entities.js';
import { Bcrypt } from './../../common/crypto/bcrypt.js';
import { UsersRepository } from './../users/users.repository.js';
import { type LoginDto } from './dtos/login.dto.js';
import { RegisterDto, RegisterResponseDto } from './dtos/register.dto.js';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersRepository: UsersRepository,
        private readonly bcrypt: Bcrypt,
        private readonly sessionService: SessionService,
        private readonly jwtService: JwtService,
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

        if (existingUser) {
            throw new ConflictException('E-mail já está em uso')
        }

        const hashedPassword = await this.bcrypt.hash(data.password)

        const user = await this.usersRepository.create({
            email: data.email,
            password_hash: hashedPassword,
            name: data.name,
        })

        const { accessToken, refreshToken } = await this.generateTokens(user.id)

        return {
            accessToken,
            refreshToken
        };
    }

    private async generateTokens(userId: User["id"]) {
        const { session, refreshToken } = await this.sessionService.create(userId)

        const accessToken = await this.generateAccessToken(userId, session.id)

        return {
            accessToken,
            refreshToken
        }
    }

    async generateAccessToken(userId: User["id"], sessionId: Session["id"]) {
        return this.jwtService.signAsync({
            sub: userId,
            sid: sessionId
        })
    }


}
