import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { LivestreamService } from './livestream.service';
import { join } from 'path';
import { Response } from 'express';
import { createReadStream, existsSync } from 'fs';

@Controller('/livestreams')
export class LivestreamController {
  constructor(private readonly livestreamService: LivestreamService) {}

  @Post('/:livestreamId/status')
  checkStatus(@Param('livestreamId') livestreamId: string): any {
    return {
      isLive: this.livestreamService.isLive(livestreamId),
    };
  }

  @Post('/segment')
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

  @Get('/:livestreamId/*')
  serveHlsFile(
    @Param('livestreamId') livestreamId: string,
    @Res() res: Response,
  ) {
    const fileName = res.req.url.split('/').pop();
    const filePath = join(
      __dirname,
      '..',
      '..',
      'media',
      'live',
      livestreamId,
      fileName as string,
    );
    if (!existsSync(filePath)) {
      throw new HttpException(
        `File ${fileName} not found`,
        HttpStatus.NOT_FOUND,
      );
    }
    res.setHeader(
      'Content-Type',
      filePath.endsWith('.m3u8')
        ? 'application/vnd.apple.mpegurl'
        : 'video/mp2t',
    );
    const fileStream = createReadStream(filePath);
    fileStream.on('error', () => {
      res.status(HttpStatus.NOT_FOUND).send({
        message: `File ${fileName} not found`,
        error: 'Not Found',
        statusCode: HttpStatus.NOT_FOUND,
      });
    });
    fileStream.pipe(res);
  }
}
