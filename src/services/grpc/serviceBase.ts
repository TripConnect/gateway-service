let grpc = require('@grpc/grpc-js');
let protoLoader = require('@grpc/proto-loader');

export default class ServiceBase {
    protected static PROTO_PATH = require.resolve('common-utils/protos/backend.proto');

    protected static backendProto = grpc
        .loadPackageDefinition(
            protoLoader.loadSync(
                ServiceBase.PROTO_PATH,
                {
                    keepCase: true,
                    longs: String,
                    enums: String,
                    defaults: true,
                    oneofs: true
                }
            )
        )
        .backend;
}