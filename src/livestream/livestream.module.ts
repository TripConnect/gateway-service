import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { LivestreamController } from './livestream.controller';
import { LivestreamService } from './livestream.service';
import { ConfigModule } from '@nestjs/config';
import { ChatGateway } from '../chat/chat.gateway';

@Module({
  imports: [
    ConfigModule,
    MulterModule.register({
      storage: memoryStorage(), // Store files in memory for direct piping to FFmpeg
      limits: {
        fileSize: 10 * 1024 * 1024, // Limit to 10MB per chunk to prevent abuse
      },
    }),
  ],
  controllers: [LivestreamController],
  providers: [LivestreamService, ChatGateway],
  exports: [LivestreamService],
})
export class LivestreamModule {}
