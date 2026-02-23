import { Module } from '@nestjs/common';
import { VouchersController } from './vouchers.controller';
import { VouchersService } from './vouchers.service';
import { MulterModule } from '@nestjs/platform-express';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MulterModule.register({ storage: undefined }),
    AuthModule,
  ],
  controllers: [VouchersController],
  providers: [VouchersService],
})
export class VouchersModule {}