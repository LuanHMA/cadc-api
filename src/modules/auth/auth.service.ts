import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Session } from '../session/session.entities.js';
import { SessionService } from '../session/session.service.js';
import { PublicUser, User } from '../users/users.entities.js';
import { toPublicUser } from '../users/users.mapper.js';
import { UsersRepository } from '../users/users.repository.js';
import { AccessTokenService } from './access-token.service.js';
import { type LoginDto, type RegisterDto } from './auth.dtos.js';
import { AuthResult, AuthTokens } from './types/auth-tokens.js';
import { Bcrypt } from './utils/bcrypt.js';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersRepository: UsersRepository,
        private readonly bcrypt: Bcrypt,
        private readonly sessionService: SessionService,
        private readonly accessTokenService: AccessTokenService,
    ) { }

    async register(data: RegisterDto): Promise<AuthResult> {
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

        const tokens = await this.startSession(user.id)

        return { user: toPublicUser(user), tokens }
    }

    async login(data: LoginDto): Promise<AuthResult> {
        const user = await this.usersRepository.findByEmail(data.email)

        const isPasswordValid = user
            ? await this.bcrypt.compare(data.password, user.password_hash)
            : false

        if (!user || !isPasswordValid) {
            throw new UnauthorizedException('Credenciais inválidas')
        }

        const tokens = await this.startSession(user.id)

        return { user: toPublicUser(user), tokens }
    }

    async refresh(refreshToken: string): Promise<AuthTokens> {
        const { session, refreshToken: newRefreshToken } = await this.sessionService.rotate(refreshToken)

        const accessToken = await this.generateAccessToken(session.user_id, session.id)

        return { accessToken, refreshToken: newRefreshToken }
    }

    async logout(sessionId: Session["id"]): Promise<void> {
        await this.sessionService.revoke(sessionId)
    }

    async me(userId: User["id"]): Promise<PublicUser> {
        const user = await this.usersRepository.findById(userId)

        if (!user) throw new UnauthorizedException('Usuário não encontrado')

        return toPublicUser(user)
    }

    private async startSession(userId: User["id"]): Promise<AuthTokens> {
        const { session, refreshToken } = await this.sessionService.create(userId)

        const accessToken = await this.generateAccessToken(userId, session.id)

        return { accessToken, refreshToken }
    }

    private generateAccessToken(userId: User["id"], sessionId: Session["id"]) {
        return this.accessTokenService.sign({ sub: userId, sid: sessionId })
    }
}
