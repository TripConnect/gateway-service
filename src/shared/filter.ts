import { Catch, ArgumentsHost } from '@nestjs/common';
import { GqlExceptionFilter } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import { StatusCode } from './status';
import * as grpc from '@grpc/grpc-js';

@Catch()
export class GrpcExceptionFilter implements GqlExceptionFilter {
  private isGrpcServiceError(error: any): error is grpc.ServiceError {
    return (
      typeof error === 'object' &&
      error !== null &&
      typeof error.code === 'number' &&
      typeof error.message === 'string'
    );
  }

  catch(exception: any, host: ArgumentsHost) {
    if (exception instanceof GraphQLError) {
      return exception;
    }

    // gRPC errors
    if (this.isGrpcServiceError(exception)) {
      switch (exception.code) {
        case grpc.status.NOT_FOUND:
          throw new GraphQLError('Not found', {
            extensions: {
              code: StatusCode.NOT_FOUND,
            },
          });
        default:
          throw new GraphQLError('Internal server error', {
            extensions: {
              code: StatusCode.INTERNAL_SERVER_ERROR,
            },
          });
      }
    }

    return new GraphQLError('Internal server error', {
      extensions: {
        code: StatusCode.INTERNAL_SERVER_ERROR,
        originalError: exception,
      },
    });
  }
}
