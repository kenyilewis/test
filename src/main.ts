import { NestFactory } from '@nestjs/core';
import { AppModule } from '@modules/app/app.module';
import { appConfig } from '@config/app.config';

async function main() {
  const app = await NestFactory.create(AppModule);
  await app.listen(appConfig.port);
  console.log(`Server is running on port ${appConfig.port}`);
}

main().catch((error) => {
  console.error('💥 Fatal error in initialization:', error);
  process.exit(1);
});
