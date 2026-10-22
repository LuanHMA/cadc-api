import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service.js";
import { User } from "../users/users.entities.js";
import { Session } from "./session.entities.js";

type CreateSessionInput = Pick<Session, "user_id" | "refresh_token_hash" | "expires_at">

type RotateSessionInput = {
    id: Session["id"]
    current_hash: string
    new_hash: string
    expires_at: Date
}

@Injectable()
export class SessionRepository {
    constructor(private readonly prisma: PrismaService) { }

    async create(data: CreateSessionInput): Promise<Session> {
        return this.prisma.session.create({ data })
    }

    async rotate({ id, current_hash, new_hash, expires_at }: RotateSessionInput) {
        return this.prisma.session.updateMany({
            where: {
                id,
                refresh_token_hash: current_hash,
                revoked_at: null,
                expires_at: { gt: new Date() },
            },
            data: { refresh_token_hash: new_hash, expires_at },
        });
    }

    async findBySessionId(sessionId: Session["id"]): Promise<Session | null> {
        return this.prisma.session.findUnique({
            where: { id: sessionId }
        });
    }

    async revoke(sessionId: Session["id"]) {
        await this.prisma.session.updateMany({
            where: { id: sessionId, revoked_at: null },
            data: { revoked_at: new Date() }
        });
    }

    async revokeAll(userId: User["id"]) {
        await this.prisma.session.updateMany({
            where: { user_id: userId, revoked_at: null },
            data: { revoked_at: new Date() }
        });
    }
}
