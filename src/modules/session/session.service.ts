import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { generateOpaqueToken, sha256 } from "../../common/crypto/token.js";
import { Env } from "../../config/env.js";
import { User } from "../users/users.entities.js";
import { Session } from "./session.entities.js";
import { SessionRepository } from "./session.repository.js";


@Injectable()
export class SessionService {
    constructor(
        private readonly sessionRepository: SessionRepository,
        private readonly config: ConfigService<Env, true>
    ) { }

    async create(userId: User["id"]) {
        const secret = generateOpaqueToken()// gera um token aleatório

        const session = await this.sessionRepository.create({// cria a sessão no banco de dados
            user_id: userId,
            refresh_token_hash: sha256(secret),
            expires_at: this.expiresAt(),
        })

        const refreshToken = `${session.id}.${secret}`// cria o token de refresh

        return {
            session,
            refreshToken
        }
    }

    async rotate(refreshToken: string) {
        const [sid, secret] = refreshToken.split('.');

        if (!sid || !secret) throw new UnauthorizedException('Refresh token inválido');

        const newSecret = generateOpaqueToken();

        const { count } = await this.sessionRepository.rotate({
            id: sid,
            refresh_token_hash: sha256(secret),
            expires_at: this.expiresAt()
        });

        if (count === 0) {
            await this.revoke(sid);
            throw new UnauthorizedException('Sessão inválida');
        }

        const session = await this.sessionRepository.findBySessionId(sid);

        if (!session) throw new UnauthorizedException('Sessão inválida');

        return { session, refreshToken: `${sid}.${newSecret}` };
    }

    async revoke(sessionId: Session["id"]) {
        await this.sessionRepository.revoke(sessionId);
    }

    async isActive(sessionId: Session["id"]) {
        const session = await this.sessionRepository.findBySessionId(sessionId);

        if(!session) throw new UnauthorizedException('Sessão inválida');

        return session.expires_at > new Date() && session.revoked_at === null;
    }

    async revokeAll(userId: User["id"]) {
        await this.sessionRepository.revokeAll(userId);
    }

    private expiresAt() {
        const days = this.config.get('REFRESH_TOKEN_TTL_DAYS', { infer: true })
        return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    }
}