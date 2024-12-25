const grpc = require('@grpc/grpc-js');

import { backendProto } from 'common-utils';

export type Generate2faResponse = {
    secret: string;
    qrCode: string;
}

type Validate2faResponse = {
    success: boolean;
    status: 'INVALID' | 'VALID';
}

export default class TwofaService {
    private static stub = new backendProto.twofa_service.TwoFactorAuthenticationService(
        process.env.ROUTE_TWOFA_SERVICE || 'localhost:31074',
        grpc.credentials.createInsecure());

    public static async generate2FASecret(
        { label }: { label: string }): Promise<Generate2faResponse> {
        return new Promise((resolve, reject) => {
            TwofaService.stub.GenerateSetting({ label }, (error: Error, result: Generate2faResponse) => {
                if (error) reject(error);
                else resolve(result);
            });
        });
    }

    public static async enable2FA(
        { resourceId, secret, label, otp }: { resourceId: string, secret: string, otp: string, label: string }): Promise<void> {
        return new Promise((resolve, reject) => {
            TwofaService.stub.CreateSetting({ resourceId, secret, label, otp }, (error: any, result: any) => {
                if (error) reject(error);
                else resolve();
            });
        });
    }

    public static async validate2FA(
        { resourceId, otp }: { resourceId: string, otp: string }): Promise<Validate2faResponse> {
        return new Promise((resolve, reject) => {
            TwofaService.stub.ValidateResource({ resourceId, otp }, (error: any, result: Validate2faResponse) => {
                if (error) reject(error);
                else resolve(result);
            });
        });
    }
}
