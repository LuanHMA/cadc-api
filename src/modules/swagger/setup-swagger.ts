import type { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

export function setupSwagger(app: INestApplication): void {
    const config = new DocumentBuilder()
        .setTitle("CADC API")
        .setDescription(
            "Rotas da API CADC. Campos com enum aceitam somente os valores listados. " +
            "Rotas protegidas aceitam o JWT no header Authorization (Bearer) ou no cookie httpOnly access_token. " +
            "POST /api/auth/refresh usa o cookie httpOnly refresh_token.",
        )
        .setVersion("0.0.1")
        .addBearerAuth({
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            description: "Access token JWT",
        })
        .addCookieAuth("access_token", {
            type: "apiKey",
            in: "cookie",
            name: "access_token",
            description: "Cookie httpOnly com o access token",
        })
        .addCookieAuth("refresh_token", {
            type: "apiKey",
            in: "cookie",
            name: "refresh_token",
            description: "Cookie httpOnly usado em POST /api/auth/refresh",
        })
        .build();

    const document = SwaggerModule.createDocument(app, config);

    SwaggerModule.setup("api/docs", app, document, {
        swaggerOptions: {
            persistAuthorization: true,
        },
    });
}
