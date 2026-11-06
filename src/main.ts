import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';
import type { Env } from './config/env.js';
import { setupSwagger } from './swagger/setup-swagger.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  const config = app.get(ConfigService<Env, true>);
  app.enableCors({
    origin: config.get('WEB_ORIGIN', { infer: true }),
    credentials: true,
  })
  app.setGlobalPrefix('api')
  app.use(cookieParser());
  setupSwagger(app);
  const port = process.env.PORT ?? 3000
  await app.listen(port);
  console.log("Server is running on port ", port)
}
await bootstrap();
