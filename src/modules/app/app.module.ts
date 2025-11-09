import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TaskModule } from '@modules/task/task.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseConfig } from '@config/database.config';

@Module({
  imports: [
    MongooseModule.forRoot(databaseConfig.uri),
    TaskModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
