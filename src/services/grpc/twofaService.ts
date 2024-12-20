const grpc = require('@grpc/grpc-js');

import ServiceBase from "./serviceBase";

export type Generate2FAResponse = {
    secret: string;
    qrCode: string;
}

type Validate2FAResponse = {
    success: boolean;
    status: 'INVALID' | 'VALID';
}

export default class TwofaService extends ServiceBase {
    private static stub = new super.backendProto.TwoFA(
        process.env.ROUTE_TWOFA_SERVICE || 'localhost:31074',
        grpc.credentials.createInsecure());

    public static async generate2FASecret(
        { label }: { label: string }): Promise<Generate2FAResponse> {
        return new Promise((resolve, reject) => {
            TwofaService.stub.GenerateSetting({ label }, (error: Error, result: Generate2FAResponse) => {
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
        { resourceId, otp }: { resourceId: string, otp: string }): Promise<Validate2FAResponse> {
        return new Promise((resolve, reject) => {
            TwofaService.stub.ValidateResource({ resourceId, otp }, (error: any, result: Validate2FAResponse) => {
                if (error) reject(error);
                else resolve(result);
            });
        });
    }
}
