import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { AuthCookies } from './auth.cookies.js';
import { LoginDtoSchema, registerDtoSchema, type LoginDto, type RegisterDto } from './auth.dtos.js';
import { AuthService } from './auth.service.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { Public } from './decorators/public.decorator.js';
import type { JwtPayload } from './types/jwt-payload.js';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly authCookies: AuthCookies,
    ) { }

    @Public()
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async register(
        @Body(new ZodValidationPipe(registerDtoSchema)) body: RegisterDto,
        @Res({ passthrough: true }) res: Response,
    ) {
        const { user, tokens } = await this.authService.register(body);

        this.authCookies.setTokens(res, tokens);

        return { user, message: 'Usuário registrado com sucesso' };
    }

    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(
        @Body(new ZodValidationPipe(LoginDtoSchema)) body: LoginDto,
        @Res({ passthrough: true }) res: Response,
    ) {
        const { user, tokens } = await this.authService.login(body);

        this.authCookies.setTokens(res, tokens);

        return { user, message: 'Login realizado com sucesso' };
    }

    @Public()
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        const refreshToken = this.authCookies.getRefreshToken(req);

        if (!refreshToken) throw new UnauthorizedException('Refresh token ausente');

        try {
            const tokens = await this.authService.refresh(refreshToken);
            this.authCookies.setTokens(res, tokens);
            return { message: 'Refresh token atualizado com sucesso' };
        } catch (error) {
            this.authCookies.clear(res);
            throw new BadRequestException('Refresh token inválido ou expirado');
        }
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    async logout(@CurrentUser() user: JwtPayload, @Res({ passthrough: true }) res: Response) {
        await this.authService.logout(user.sid);

        this.authCookies.clear(res);

        return { message: 'Logout realizado com sucesso' };
    }

    @Get('me')
    async me(@CurrentUser() user: JwtPayload) {
        console.log(user)

        return this.authService.me(user.sub);
    }
}
