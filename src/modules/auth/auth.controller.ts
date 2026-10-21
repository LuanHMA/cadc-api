import { Body, Controller, Get, Post } from '@nestjs/common';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { AuthService } from './auth.service.js';
import { LoginDtoSchema, type LoginDto } from './dtos/login.dto.js';
import { registerDtoSchema, type RegisterDto } from './dtos/register.dto.js';

@Controller('auth') 
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('login')
    async login(@Body(new ZodValidationPipe(LoginDtoSchema)) body: LoginDto) {
        return this.authService.login(body);
    }

    @Post('register')
    async register(@Body(new ZodValidationPipe(registerDtoSchema)) body: RegisterDto) {
        return this.authService.register(body);
    }

    @Get('me')
    async me() {
        // Verificar se o usuário está autenticado
        // Buscar usuário logado
    }
}
