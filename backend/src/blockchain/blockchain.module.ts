import { Module } from '@nestjs/common';
import { Lv1MintService } from './lv1-mint.service';

@Module({
  providers: [Lv1MintService],
  exports: [Lv1MintService],
})
export class BlockchainModule {}
