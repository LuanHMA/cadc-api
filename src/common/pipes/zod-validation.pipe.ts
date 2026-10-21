
import { BadRequestException, PipeTransform } from '@nestjs/common';
import { ZodType } from 'zod';

export class ZodValidationPipe implements PipeTransform {
    constructor(private schema: ZodType) { }

    transform(value: unknown) {
        const result = this.schema.safeParse(value);
        if (!result.success) {
          throw new BadRequestException({
            message: 'Dados inválidos',
            errors: result.error.issues.map(({ path, message }) => {
              return { 
                path: path.length === 1 ? path[0] : path.join('.'),
                message
              } as const
            }),
          });
        }
        return result.data;
      }
}
