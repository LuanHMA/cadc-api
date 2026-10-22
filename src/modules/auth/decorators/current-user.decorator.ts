import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthRequest } from '../types/jwt-payload.js';

export const CurrentUser = createParamDecorator(
    (_: unknown, context: ExecutionContext) => context.switchToHttp().getRequest<AuthRequest>().user,
);
