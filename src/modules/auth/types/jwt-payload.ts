import type { Request } from 'express';

export type JwtPayload = { sub: number; sid: string };
export type AuthRequest = Request & { user: JwtPayload };