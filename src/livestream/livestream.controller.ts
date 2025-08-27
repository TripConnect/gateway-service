import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { GqlAuthGuard } from '../guards/auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { LivestreamService } from './livestream.service';

@Controller('/livestreams')
export class LivestreamController {
  constructor(private readonly livestreamService: LivestreamService) {}

  @Post()
  createNewOne(): any {
    return {
      livestreamId: crypto.randomUUID(),
    };
  }

  @Post('/:livestreamId/status')
  @UseGuards(GqlAuthGuard)
  checkStatus(@Param('livestreamId') livestreamId: string): any {
    return {
      isLive: this.livestreamService.isLive(livestreamId),
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
      await this.livestreamService.processSegment(file.buffer, livestreamId);
      return { message: 'Chunk processed successfully' };
    } catch (error) {
      throw new HttpException(
        `Failed to process segment: ${error}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
