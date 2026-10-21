import { z } from "zod"

export const envSchema = z.object({
    DATABASE_URL: z.string("DATABASE_URL is required"),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_ACCESS_EXPIRES_IN: z.coerce.number().default(900), // segundos
    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().default(7),
  })

export type Env = z.infer<typeof envSchema>

export const validateEnv = (env: Record<string, unknown>) => {
    const parsed = envSchema.safeParse(env)

    if(!parsed.success){
        throw new Error(`Invalid environment variables: ${JSON.stringify(parsed.error.format(), null, 2)}`)
    }

    return parsed.data
}