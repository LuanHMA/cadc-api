import { createHash, randomBytes } from 'node:crypto';

export const generateOpaqueToken = () => randomBytes(32).toString('base64url');// Gera uma string aleatória de 32 bytes em base64url

export const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');// Gera um hash SHA-256 de uma string
