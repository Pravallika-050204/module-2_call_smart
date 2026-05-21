import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  const PORT = process.env.PORT || 3003;
  await app.listen(PORT);
  console.log(`API Modular Monolith running on port ${PORT}`);
}
bootstrap();
