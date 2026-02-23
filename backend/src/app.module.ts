import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VouchersModule } from './vouchers/vouchers.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    VouchersModule,
    AuthModule,
  ],
})
export class AppModule {}
