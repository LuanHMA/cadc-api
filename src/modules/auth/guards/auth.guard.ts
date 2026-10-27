import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SessionService } from '../../session/session.service.js';
import { AccessTokenService } from '../access-token.service.js';
import { AuthCookies } from '../auth.cookies.js';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import type { AuthRequest } from '../types/jwt-payload.js';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly accessTokenService: AccessTokenService,
        private readonly sessionService: SessionService,
        private readonly authCookies: AuthCookies,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        if (this.isPublic(context)) return true;

        const request = context.switchToHttp().getRequest<AuthRequest>();
        const token = this.extractToken(request);

        if (!token) throw new UnauthorizedException('Token de acesso ausente');

        const payload = await this.accessTokenService.verify(token);

        if (!payload) throw new UnauthorizedException('Token de acesso inválido ou expirado');

        const isSessionActive = await this.sessionService.isActive(payload.sid);

        if (!isSessionActive) throw new UnauthorizedException('Sessão encerrada');

        request.user = payload;
        return true;
    }

    private isPublic(context: ExecutionContext): boolean {
        //Pega o valor de IS_PUBLIC_KEY nos metadados invisiveis do metodo ou classe que o metodo é publico 
        // Primeiro ele pega o valor salvo no metodo e depois na classe, se um for undefined, retorna o outro, se os dois forem undefined, retorna false.
        return this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]) ?? false;
    }

    private extractToken(request: AuthRequest): string | undefined {
        const fromCookie = this.authCookies.getAccessToken(request);
        if (fromCookie) return fromCookie;

        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' && token ? token : undefined;
    }
}
