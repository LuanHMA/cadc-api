import { BadRequestException, Controller, Get, HttpCode, HttpStatus, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthSessionResponseSchema, MessageResponseSchema, PublicUserSchema } from '../swagger/response.schemas.js';
import { ApiDoc, ZodBody } from '../swagger/zod-openapi.js';
import { AuthCookies } from './auth.cookies.js';
import { LoginDtoSchema, registerDtoSchema, type LoginDto, type RegisterDto } from './auth.dtos.js';
import { AuthService } from './auth.service.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { Public } from './decorators/public.decorator.js';
import type { JwtPayload } from './types/jwt-payload.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly authCookies: AuthCookies,
    ) { }

    @Public()
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    @ApiDoc({
        summary: 'Registrar usuário',
        created: [AuthSessionResponseSchema, 'Usuário registrado. Os tokens são gravados em cookies httpOnly.'],
    })
    async register(
        @ZodBody(registerDtoSchema) body: RegisterDto,
        @Res({ passthrough: true }) res: Response,
    ) {
        const { user, tokens } = await this.authService.register(body);

        this.authCookies.setTokens(res, tokens);

        return { user, message: 'Usuário registrado com sucesso' };
    }

    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiDoc({
        summary: 'Entrar',
        ok: [AuthSessionResponseSchema, 'Login realizado. Os tokens são gravados em cookies httpOnly.'],
        unauthorized: 'Credenciais inválidas',
    })
    async login(
        @ZodBody(LoginDtoSchema) body: LoginDto,
        @Res({ passthrough: true }) res: Response,
    ) {
        const { user, tokens } = await this.authService.login(body);

        this.authCookies.setTokens(res, tokens);

        return { user, message: 'Login realizado com sucesso' };
    }

    @Public()
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @ApiDoc({
        summary: 'Renovar access token',
        description: 'Lê o cookie httpOnly refresh_token. Não possui body.',
        cookieAuth: 'refresh_token',
        ok: [MessageResponseSchema, 'Tokens renovados e gravados nos cookies.'],
        unauthorized: 'Refresh token ausente, inválido ou expirado',
    })
    async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        const refreshToken = this.authCookies.getRefreshToken(req);

        if (!refreshToken) throw new UnauthorizedException('Refresh token ausente');

        try {
            const tokens = await this.authService.refresh(refreshToken);
            this.authCookies.setTokens(res, tokens);
            return { message: 'Refresh token atualizado com sucesso' };
        } catch {
            this.authCookies.clear(res);
            throw new BadRequestException('Refresh token inválido ou expirado');
        }
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @ApiDoc({
        summary: 'Encerrar sessão',
        ok: [MessageResponseSchema, 'Logout realizado e cookies limpos.'],
        protected: true,
    })
    async logout(@CurrentUser() user: JwtPayload, @Res({ passthrough: true }) res: Response) {
        await this.authService.logout(user.sid);

        this.authCookies.clear(res);

        return { message: 'Logout realizado com sucesso' };
    }

    @Get('me')
    @ApiDoc({
        summary: 'Usuário autenticado',
        ok: PublicUserSchema,
        protected: true,
    })
    async me(@CurrentUser() user: JwtPayload) {
        return this.authService.me(user.sub);
    }
}
