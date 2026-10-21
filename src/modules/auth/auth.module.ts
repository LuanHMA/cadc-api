import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { BcryptService } from './hashing/bcrypt.service.js';

@Module({
  controllers: [AuthController],
  providers: [AuthService, BcryptService]
})
export class AuthModule {}
