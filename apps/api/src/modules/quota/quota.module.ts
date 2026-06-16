import { Module } from '@nestjs/common';
import { QuotaController } from './quota.controller';

@Module({
  controllers: [QuotaController],
})
export class QuotaModule {}
