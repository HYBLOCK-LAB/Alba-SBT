import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { AuthUser } from '../../common/auth/auth-user.interface';
import { ApprovalsService } from './approvals.service';
import { SignApprovalDto } from './dto/sign-approval.dto';

@Controller('approvals')
@UseGuards(JwtAuthGuard)
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Get('pending')
  listPending(@CurrentUser() user: AuthUser) {
    return this.approvalsService.listPendingForManager(user);
  }

  @Get('requests/:requestId/signing-payload')
  getSigningPayload(@Param('requestId') requestId: string, @CurrentUser() user: AuthUser) {
    return this.approvalsService.getSigningPayload(requestId, user);
  }

  @Post('sign')
  sign(@Body() payload: SignApprovalDto, @CurrentUser() user: AuthUser) {
    return this.approvalsService.signAndMint(payload, user);
  }
}
