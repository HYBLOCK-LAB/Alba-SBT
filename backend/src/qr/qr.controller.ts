import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { ok } from '../common/utils/api-response';
import { CreateQrTokenDto } from './dto/create-qr-token.dto';
import { VerifyQrTokenDto } from './dto/verify-qr-token.dto';
import { QrService } from './qr.service';

@UseGuards(JwtAuthGuard)
@Controller('qr')
export class QrController {
  constructor(private readonly qrService: QrService) {}

  @Post('tokens')
  async createToken(@Body() dto: CreateQrTokenDto, @CurrentUser() user: { id: string }) {
    const token = await this.qrService.createToken(dto.storeId, user.id);
    return ok(token);
  }

  @Post('verify')
  async verifyToken(@Body() dto: VerifyQrTokenDto) {
    const token = await this.qrService.verifyTokenForStore(dto.qrToken, dto.storeId);
    return ok(token);
  }
}
