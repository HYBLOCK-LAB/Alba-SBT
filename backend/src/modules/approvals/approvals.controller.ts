import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { AuthenticatedUser } from '../auth/auth.types.js';
import { ApprovalsService } from './approvals.service.js';
import { SignApprovalDto } from './dto/sign-approval.dto.js';

@Controller('approvals')
@UseGuards(JwtAuthGuard)
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Get('pending')
  listPending(@CurrentUser() user: AuthenticatedUser) {
    return this.approvalsService.listPendingForManager(user);
  }

  @Get('requests/:requestId/signing-payload')
  getSigningPayload(@Param('requestId') requestId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.approvalsService.getSigningPayload(requestId, user);
  }

  @Post('sign')
  sign(@Body() payload: SignApprovalDto, @CurrentUser() user: AuthenticatedUser) {
    return this.approvalsService.signAndMint(payload, user);
  }
}
