import { Injectable } from '@nestjs/common';
import { join } from 'path';
import { promises as fs } from 'fs';
import { spawn } from 'child_process';
import { Livestream } from './models/graphql.model';
import { ConfigService } from '@nestjs/config';
import { DiscoveryServiceClient } from 'node-proto-lib/protos/discovery_service_grpc_pb';
import * as grpc from '@grpc/grpc-js';
import { DiscoveryRequest } from 'node-proto-lib/protos/discovery_service_pb';
import { LivestreamServiceClient } from 'node-proto-lib/protos/livestream_service_grpc_pb';
import {
  FindLivestreamRequest,
  SearchLivestreamsRequest,
} from 'node-proto-lib/protos/livestream_service_pb';

@Injectable()
export class LivestreamService {
  private static stub: LivestreamServiceClient;
  private activeStreams: Map<string, { process: any; tempFile: string }> =
    new Map();

  constructor(private configService: ConfigService) {}

  async searchLivestream(req: SearchLivestreamsRequest): Promise<Livestream[]> {
    const stub = await this.getStub();

    return new Promise((resolve, reject) => {
      stub.searchLivestream(req, (error, livestreams) => {
        if (error) reject(error);
        else
          resolve(
            livestreams
              .getLivestreamsList()
              .map((livestream) => Livestream.fromGrpc(livestream)),
          );
      });
    });
  }

  async findLivestream(req: FindLivestreamRequest): Promise<Livestream> {
    const stub = await this.getStub();

    return new Promise((resolve, reject) => {
      stub.findLivestream(req, (error, livestream) => {
        if (error) reject(error);
        else resolve(Livestream.fromGrpc(livestream));
      });
    });
  }

  async processSegment(chunk: Buffer, livestreamId: string): Promise<void> {
    const streamDir = join(
      __dirname,
      '..',
      '..',
      'media',
      'live',
      livestreamId,
    );
    const tempFile = join(streamDir, 'temp.webm'); // Optional for debugging
    const hlsOutput = join(streamDir, 'index.m3u8');

    // Create directory if it doesn't exist
    await fs.mkdir(streamDir, { recursive: true });

    // Initialize FFmpeg process for this stream if not already running
    if (!this.activeStreams.has(livestreamId)) {
      const ffmpeg = spawn(
        'ffmpeg',
        [
          '-i',
          'pipe:0', // Read from stdin (WebM chunks)
          '-c:v',
          'libx264', // Video codec
          '-c:a',
          'aac', // Audio codec
          '-f',
          'hls', // Output HLS
          '-hls_time',
          '2', // 2-second segments
          '-hls_list_size',
          '3',
          '-hls_flags',
          'delete_segments+append_list',
          '-hls_segment_filename',
          join(streamDir, 'segment_%03d.ts'),
          hlsOutput, // Output .m3u8 file
        ],
        { stdio: ['pipe', 'inherit', 'inherit'] },
      );

      ffmpeg.on('error', (err) => {
        console.error(`FFmpeg error for ${livestreamId}:`, err);
        this.activeStreams.delete(livestreamId);
      });

      ffmpeg.on('close', () => {
        this.activeStreams.delete(livestreamId);
      });

      this.activeStreams.set(livestreamId, { process: ffmpeg, tempFile });
    }

    // Get the FFmpeg process
    const stream = this.activeStreams.get(livestreamId);
    if (!stream) {
      throw new Error('Livestream not initialized');
    }

    // Pipe chunk to FFmpeg stdin
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    stream.process.stdin.write(chunk);
  }

  endLive(livestreamId: string): void {
    const stream = this.activeStreams.get(livestreamId);
    if (stream) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      stream.process.stdin.end();
      this.activeStreams.delete(livestreamId);
    }
  }

  isLive(livestreamId: string): boolean {
    return this.activeStreams.has(livestreamId);
  }

  private async getStub(): Promise<LivestreamServiceClient> {
    if (LivestreamService.stub) return LivestreamService.stub;

    return new Promise((resolve, reject) => {
      const discoveryClient = new DiscoveryServiceClient(
        this.configService.get<string>('discovery.address') as string,
        grpc.credentials.createInsecure(),
      );
      const discoverRequest = new DiscoveryRequest().setServiceName(
        'livestream-service',
      );
      discoveryClient.discover(discoverRequest, (error, resp) => {
        if (error) {
          reject(error);
        } else {
          resolve(
            new LivestreamServiceClient(
              `${resp.getHost()}:${resp.getPort()}`,
              grpc.credentials.createInsecure(),
            ),
          );
        }
      });
    });
  }
}
