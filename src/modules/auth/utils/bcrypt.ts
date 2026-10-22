import { Injectable } from '@nestjs/common'
import * as bcrypt from 'bcrypt'

@Injectable()
export class Bcrypt {
    async hash(data: string): Promise<string> {
        return await bcrypt.hash(data, 10)
    }

    async compare(data: string, hash: string): Promise<boolean> {
        return await bcrypt.compare(data, hash)
    }
}
