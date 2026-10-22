import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service.js";
import { User } from "../users/users.entities.js";
import { Session } from "./session.entities.js";

type CreateSessionInput = Pick<Session, "user_id" | "refresh_token_hash" | "expires_at">

type UpdateSessionInput = Pick<Session, "id" | "refresh_token_hash" | "expires_at">

@Injectable()
export class SessionRepository {
    constructor(private readonly prisma: PrismaService) { }

    async create({ user_id, refresh_token_hash, expires_at }: CreateSessionInput) {
        return this.prisma.session.create({
            data: {
                user_id,
                refresh_token_hash,
                expires_at,
            }
        })
    }

    async rotate({ id, refresh_token_hash, expires_at }: UpdateSessionInput) {
        return this.prisma.session.updateMany({
            where: { id },
            data: {
                refresh_token_hash,
                expires_at,
                revoked_at: null
            }
        });
    }

    async findBySessionId(sessionId: Session["id"]) {
        return this.prisma.session.findUnique({
            where: { id: sessionId }
        });
    }

    async revoke(sessionId: Session["id"]) {
        await this.prisma.session.updateMany({
            where: { id: sessionId },
            data: { revoked_at: new Date() }
        });
    }

    async revokeAll(userId: User["id"]) {
        await this.prisma.session.updateMany({
            where: { user_id: userId },
            data: { revoked_at: new Date() }
        });
    }
}