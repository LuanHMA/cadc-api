import { Module } from "@nestjs/common";
import { SessionRepository } from "./session.repository.js";
import { SessionService } from "./session.service.js";

@Module({
    providers: [SessionService, SessionRepository],
    exports: [SessionService]
})

export class SessionModule {}