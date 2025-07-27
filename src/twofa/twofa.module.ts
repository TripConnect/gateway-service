import { Module } from '@nestjs/common';
import { UserModule } from 'src/user/user.module';
import { TwofaService } from './twofa.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule, UserModule],
  providers: [TwofaService],
  exports: [TwofaService],
})
export class TwofaModule {}
