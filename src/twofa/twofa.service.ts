import * as grpc from '@grpc/grpc-js';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DiscoveryServiceClient } from 'node-proto-lib/protos/discovery_service_grpc_pb';
import { DiscoveryRequest } from 'node-proto-lib/protos/discovery_service_pb';
import { TwoFactorAuthenticationServiceClient } from 'node-proto-lib/protos/twofa_service_grpc_pb';
import {
  Create2faRequest,
  Generate2faRequest,
  Validate2faRequest,
} from 'node-proto-lib/protos/twofa_service_pb';
import { Settings, Validation } from './models/graphql.model';
import { ResponseModel } from 'src/shared/models/response.model';

@Injectable()
export class TwofaService {
  private static twofaClient: TwoFactorAuthenticationServiceClient;

  constructor(private configService: ConfigService) {}

  private async getTwofaClient(): Promise<TwoFactorAuthenticationServiceClient> {
    if (TwofaService.twofaClient) return TwofaService.twofaClient;

    return new Promise((resolve, reject) => {
      const discoveryClient = new DiscoveryServiceClient(
        this.configService.get<string>('discovery.address') as string,
        grpc.credentials.createInsecure(),
      );
      const discoverRequest = new DiscoveryRequest().setServiceName(
        'twofa-service',
      );
      discoveryClient.discover(discoverRequest, (error, resp) => {
        if (error) {
          reject(error);
        } else {
          resolve(
            new TwoFactorAuthenticationServiceClient(
              `${resp.getHost()}:${resp.getPort()}`,
              grpc.credentials.createInsecure(),
            ),
          );
        }
      });
    });
  }

  async generateTwofaSecret(req: Generate2faRequest): Promise<Settings> {
    const userClient = await this.getTwofaClient();

    return new Promise((resolve, reject) => {
      userClient.generateSetting(req, (error, resp) => {
        if (error) reject(error);
        else resolve(Settings.fromGrpcGeneration(resp));
      });
    });
  }

  async enableTwofa(req: Create2faRequest): Promise<ResponseModel> {
    const userClient = await this.getTwofaClient();

    return new Promise((resolve, reject) => {
      userClient.generateSetting(req, (error, resp) => {
        if (error) reject(error);
        else resolve(new ResponseModel(true));
      });
    });
  }

  async validateTwofa(req: Validate2faRequest): Promise<Validation> {
    const userClient = await this.getTwofaClient();

    return new Promise((resolve, reject) => {
      userClient.validateResource(req, (error, resp) => {
        if (error) reject(error);
        else resolve(Validation.fromGrpcValidation(resp));
      });
    });
  }
}
