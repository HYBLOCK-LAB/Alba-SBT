import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { ok } from '../common/utils/api-response';
import { CompleteSignupDto } from './dto/complete-signup.dto';
import { RequestSiweNonceDto } from './dto/request-siwe-nonce.dto';
import { VerifySiweDto } from './dto/verify-siwe.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('siwe/nonce')
  async requestNonce(@Body() dto: RequestSiweNonceDto) {
    const result = await this.authService.requestSiweNonce(dto.walletAddress);
    return ok(result);
  }

  @Post('siwe/verify')
  async verifySiwe(@Body() dto: VerifySiweDto) {
    const result = await this.authService.verifySiwe(dto);
    return ok(result);
  }

  @Post('signup')
  async completeSignup(@Body() dto: CompleteSignupDto) {
    const result = await this.authService.completeSignup(dto);
    return ok(result);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getCurrentUser(
    @CurrentUser() user: { id: string; walletAddress: string; accountType: 'worker' | 'manager' },
  ) {
    return ok(user);
  }
}
