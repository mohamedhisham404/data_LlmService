import { Module } from '@nestjs/common';
import { LlmModule } from './llm/llm.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    LlmModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
})
export class AppModule {}
