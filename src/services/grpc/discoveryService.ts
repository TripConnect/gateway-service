const grpc = require('@grpc/grpc-js');

import { backendProto } from 'common-utils';

export type ServiceInstance = {
    host: string;
    port: number;
}

export default class DiscoveryService {

    private static _stub = null;

    static {
        DiscoveryService._stub = new backendProto.discovery_service.DiscoveryService(
            process.env.NODE_ENV === "local" ? 'localhost:31079' : "discovery-service:31079",
            grpc.credentials.createInsecure());
    }

    private static get STUB(): any {
        return DiscoveryService._stub;
    }

    public static async discover(
        { serviceName }: { serviceName: string }): Promise<ServiceInstance> {
        return new Promise((resolve, reject) => {
            DiscoveryService.STUB.Discover({ serviceName }, (error: Error, result: ServiceInstance) => {
                if (error) reject(error);
                else resolve(result);
            });
        });
    }

}
