import { PublicUser, User } from "./users.entities.js";

export const toPublicUser = (user: User): PublicUser => {
    const { password_hash: _passwordHash, ...publicUser } = user
    return publicUser
}
