const grpc = require('@grpc/grpc-js');

import ServiceBase from "./serviceBase";

export type Generate2FAResponse = {
    secret: string;
    qrCode: string;
}

export default class TwofaService extends ServiceBase {
    private static stub = new super.backendProto.TwoFA(
        process.env.ROUTE_TWOFA_SERVICE, grpc.credentials.createInsecure());

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
        { secret, label, otp }: { secret: string, otp: string, label: string }): Promise<void> {
        return new Promise((resolve, reject) => {
            TwofaService.stub.CreateSetting({ secret, label, otp }, (error: any, result: any) => {
                if (error) reject(error);
                else resolve();
            });
        });
    }
}
