import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

//Salva nos metadados invisiveis do metodo ou classe que o metodo é publico. (Dps lê no auth.guard)
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
