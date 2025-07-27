import { Field, ObjectType } from '@nestjs/graphql';
import {
  Generate2faResponse,
  Validate2faResponse,
} from 'node-proto-lib/protos/twofa_service_pb';

@ObjectType()
export class Settings {
  @Field()
  secret: string;

  @Field()
  qrCode: string;

  static fromGrpcGeneration(message: Generate2faResponse): Settings {
    const settings = new Settings();
    settings.secret = message.getSecret();
    settings.qrCode = message.getQrCode();
    return settings;
  }
}

@ObjectType()
export class Validation {
  @Field()
  success: boolean;

  @Field()
  status: string;

  static fromGrpcValidation(message: Validate2faResponse): Validation {
    const validation = new Validation();
    validation.success = message.getSuccess();
    validation.status = message.getStatus().toString();
    return validation;
  }
}
