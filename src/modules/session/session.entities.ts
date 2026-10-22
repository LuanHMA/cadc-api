import { User } from "../users/users.entities.js";

export interface Session {
    id: string,
    user_id: User["id"],
    refresh_token_hash: string,
    expires_at: Date,
    revoked_at: Date | null,
    created_at: Date,
    updated_at: Date
}