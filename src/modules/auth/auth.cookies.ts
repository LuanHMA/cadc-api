import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { CookieOptions, Request, Response } from "express";
import type { Env } from "../../config/env.js";
import type { AuthTokens } from "./types/auth-tokens.js";

const ACCESS_TOKEN_COOKIE = 'access_token';
const REFRESH_TOKEN_COOKIE = 'refresh_token';

const ACCESS_TOKEN_PATH = '/';
const REFRESH_TOKEN_PATH = '/auth';

const MS_PER_SECOND = 1000;
const MS_PER_DAY = 24 * 60 * 60 * MS_PER_SECOND;

@Injectable()
export class AuthCookies {
    constructor(private readonly config: ConfigService<Env, true>) { }
    
    setTokens(res: Response, { accessToken, refreshToken }: AuthTokens): void {
        const accessTtlSeconds = this.config.get('JWT_ACCESS_EXPIRES_IN', { infer: true });
        const refreshTtlDays = this.config.get('REFRESH_TOKEN_TTL_DAYS', { infer: true });

        res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
            ...this.baseOptions(ACCESS_TOKEN_PATH),
            maxAge: accessTtlSeconds * MS_PER_SECOND,
        });

        res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
            ...this.baseOptions(REFRESH_TOKEN_PATH),
            maxAge: refreshTtlDays * MS_PER_DAY,
        });
    }

    getAccessToken(req: Request): string | undefined {
        return this.read(req, ACCESS_TOKEN_COOKIE);
    }

    getRefreshToken(req: Request): string | undefined {
        return this.read(req, REFRESH_TOKEN_COOKIE);
    }

    clear(res: Response): void {
        res.clearCookie(ACCESS_TOKEN_COOKIE, this.baseOptions(ACCESS_TOKEN_PATH));
        res.clearCookie(REFRESH_TOKEN_COOKIE, this.baseOptions(REFRESH_TOKEN_PATH));
    }

    private read(req: Request, name: string): string | undefined {
        const value: unknown = req.cookies?.[name];
        return typeof value === 'string' && value.length > 0 ? value : undefined;
    }

    private baseOptions(path: string): CookieOptions {
        return {
            httpOnly: true,
            secure: this.config.get('NODE_ENV', { infer: true }) === 'production',
            sameSite: 'strict',
            path,
        };
    }
}
