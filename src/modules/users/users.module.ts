import { Module } from '@nestjs/common';
import { UsersService } from './users.service.js';

@Module({
  controllers: [],
  providers: [UsersService]
})
export class UsersModule {}
