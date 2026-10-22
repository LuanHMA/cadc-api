import type { PublicUser } from '../../users/users.entities.js';

export type AuthTokens = {
    accessToken: string
    refreshToken: string
}

export type AuthResult = {
    user: PublicUser
    tokens: AuthTokens
}
