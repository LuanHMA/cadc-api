import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { JwtPayload } from './types/jwt-payload.js';

@Injectable()
export class AccessTokenService {
    constructor(private readonly jwtService: JwtService) { }

    sign(payload: JwtPayload): Promise<string> {
        return this.jwtService.signAsync(payload);
    }

    async verify(token: string): Promise<JwtPayload | null> {
        try {
            return await this.jwtService.verifyAsync<JwtPayload>(token);
        } catch {
            return null;
        }
    }
}
