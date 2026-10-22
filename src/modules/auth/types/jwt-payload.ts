import type { Request } from 'express';
import type { Session } from '../../session/session.entities.js';
import type { User } from '../../users/users.entities.js';

export type JwtPayload = { sub: User['id']; sid: Session['id'] };
export type AuthRequest = Request & { user: JwtPayload };
