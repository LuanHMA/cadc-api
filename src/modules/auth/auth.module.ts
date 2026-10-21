import { Module } from '@nestjs/common';
import { Bcrypt } from '../../common/crypto/bcrypt.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

@Module({
  controllers: [AuthController],
  providers: [AuthService, Bcrypt]
})
export class AuthModule {}
