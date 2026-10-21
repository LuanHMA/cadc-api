import { Module } from '@nestjs/common';
import { UsersRepository } from './users.repository.js';
import { UsersService } from './users.service.js';

@Module({
  providers: [UsersService, UsersRepository],
  exports: [UsersRepository]
})
export class UsersModule {}
