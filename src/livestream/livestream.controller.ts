import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
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

  // @Get('/:livestreamId/:file(*)')
  // async proxyHls(
  //   @Param('livestreamId') streamKey: string,
  //   @Param('file') file: string,
  //   @Res() res: Response,
  // ) {
  //   const filePath = join(
  //     __dirname,
  //     '..',
  //     '..',
  //     'media',
  //     'live',
  //     streamKey,
  //     file,
  //   );
  //   try {
  //     const stream = createReadStream(filePath);
  //     const contentType = file.endsWith('.m3u8')
  //       ? 'application/vnd.apple.mpegurl'
  //       : 'video/MP2T';
  //     res.setHeader('Content-Type', contentType);
  //     stream.on('error', () => {
  //       res.status(404).send('File not found');
  //     });
  //     stream.pipe(res);
  //   } catch (error) {
  //     res.status(500).send('Error serving file');
  //   }
  // }
}
