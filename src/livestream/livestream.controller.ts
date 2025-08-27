import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { GqlAuthGuard } from '../guards/auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { LivestreamService } from './livestream.service';

@Controller('/livestream')
export class LivestreamController {
  constructor(private readonly streamsService: LivestreamService) {}

  @Post()
  createNewOne(): any {
    return {
      livestreamId: crypto.randomUUID(),
    };
  }

  @Post()
  @UseGuards(GqlAuthGuard)
  checkStatus(): any {
    return {
      isLive: true,
    };
  }

  @Post()
  @UseGuards(GqlAuthGuard)
  @UseInterceptors(FileInterceptor('segment'))
  async uploadSegment(
    @UploadedFile() file: Express.Multer.File,
    @Body('livestreamId') livestreamId: string,
  ): Promise<any> {
    if (!file || !livestreamId) {
      throw new HttpException(
        'Missing segment or livestreamId',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      await this.streamsService.processChunk(file.buffer, livestreamId);
      return { message: 'Chunk processed successfully' };
    } catch (error) {
      throw new HttpException(
        `Failed to process chunk: ${error}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
