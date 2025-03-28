const grpc = require('@grpc/grpc-js');

import { backendProto } from 'common-utils';
import DiscoveryService from './discoveryService';
import logger from 'utils/logging';

export type Generate2faResponse = {
    secret: string;
    qrCode: string;
}

type Validate2faResponse = {
    success: boolean;
    status: 'INVALID' | 'VALID';
}

export default class TwofaService {

    private static _stub = null;

    static {
        DiscoveryService.discover({ serviceName: "twofa-service" })
            .then(serviceInstance => {
                TwofaService._stub = new backendProto.twofa_service.TwoFactorAuthenticationService(
                    `${serviceInstance.host}:${serviceInstance.port}`,
                    grpc.credentials.createInsecure()
                );
            })
            .catch(error => {
                logger.error(error);
                logger.error("Failed to initialize gRPC stub");
            });
    }

    private static get STUB(): any {
        return TwofaService._stub;
    }

    public static async generate2FASecret(
        { label }: { label: string }): Promise<Generate2faResponse> {
        return new Promise((resolve, reject) => {
            TwofaService.STUB.GenerateSetting({ label }, (error: Error, result: Generate2faResponse) => {
                if (error) reject(error);
                else resolve(result);
            });
        });
    }

    public static async enable2FA(
        { resourceId, secret, label, otp }: { resourceId: string, secret: string, otp: string, label: string }): Promise<void> {
        return new Promise((resolve, reject) => {
            TwofaService.STUB.CreateSetting({ resourceId, secret, label, otp }, (error: any, result: any) => {
                if (error) reject(error);
                else resolve();
            });
        });
    }

    public static async validate2FA(
        { resourceId, otp }: { resourceId: string, otp: string }): Promise<Validate2faResponse> {
        return new Promise((resolve, reject) => {
            TwofaService.STUB.ValidateResource({ resourceId, otp }, (error: any, result: Validate2faResponse) => {
                if (error) reject(error);
                else resolve(result);
            });
        });
    }
}
