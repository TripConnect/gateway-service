const grpc = require('@grpc/grpc-js');

import { backendProto } from 'common-utils';
import DiscoveryService from './discoveryService';

export type Generate2faResponse = {
    secret: string;
    qrCode: string;
}

type Validate2faResponse = {
    success: boolean;
    status: 'INVALID' | 'VALID';
}

export default class TwofaService {

    private static stub = null;

    private static async getStub(): Promise<any> {
        if (!TwofaService.stub) {
            let serviceInstance = await DiscoveryService.discover({ serviceName: "twofa-service" });
            TwofaService.stub = new backendProto.twofa_service.TwoFactorAuthenticationService(
                `${serviceInstance.host}:${serviceInstance.port}`,
                grpc.credentials.createInsecure());
        }

        return TwofaService.stub;
    }

    public static async generate2FASecret(
        { label }: { label: string }): Promise<Generate2faResponse> {
        let stub = await TwofaService.getStub();
        return new Promise((resolve, reject) => {
            stub.GenerateSetting({ label }, (error: Error, result: Generate2faResponse) => {
                if (error) reject(error);
                else resolve(result);
            });
        });
    }

    public static async enable2FA(
        { resourceId, secret, label, otp }: { resourceId: string, secret: string, otp: string, label: string }): Promise<void> {
        let stub = await TwofaService.getStub();
        return new Promise((resolve, reject) => {
            stub.CreateSetting({ resourceId, secret, label, otp }, (error: any, result: any) => {
                if (error) reject(error);
                else resolve();
            });
        });
    }

    public static async validate2FA(
        { resourceId, otp }: { resourceId: string, otp: string }): Promise<Validate2faResponse> {
        let stub = await TwofaService.getStub();
        return new Promise((resolve, reject) => {
            stub.ValidateResource({ resourceId, otp }, (error: any, result: Validate2faResponse) => {
                if (error) reject(error);
                else resolve(result);
            });
        });
    }
}
