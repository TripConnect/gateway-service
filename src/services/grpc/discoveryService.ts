const grpc = require('@grpc/grpc-js');

import { backendProto } from 'common-utils';

export type ServiceInstance = {
    host: string;
    port: number;
}

export default class DiscoveryService {

    private static stub = null;

    private static async getStub(): Promise<any> {
        if (!DiscoveryService.stub) {
            DiscoveryService.stub = new backendProto.discovery_service.DiscoveryService(
                process.env.NODE_ENV === "local" ? 'localhost:31079' : "discovery-service:31079",
                grpc.credentials.createInsecure());
        }
        return DiscoveryService.stub;
    }

    public static async discover(
        { serviceName }: { serviceName: string }): Promise<ServiceInstance> {
        let stub = await DiscoveryService.getStub();
        return new Promise((resolve, reject) => {
            stub.Discover({ serviceName }, (error: Error, result: ServiceInstance) => {
                if (error) reject(error);
                else resolve(result);
            });
        });
    }

}
