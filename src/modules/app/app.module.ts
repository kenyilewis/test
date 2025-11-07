import { Module } from '@nestjs/common';
import { TaskModule } from '@modules/task/task.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [TaskModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
