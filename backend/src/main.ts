import 'dotenv/config';
import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT ?? 3000);

  app.setGlobalPrefix('api');

  await app.listen(port);
}

bootstrap().catch((error: unknown) => {
  console.error('Failed to bootstrap backend', error);
  process.exit(1);
});
