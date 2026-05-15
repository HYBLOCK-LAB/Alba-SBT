import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { ok } from '../common/utils/api-response';
import { AcceptExtraWorkDto } from './dto/accept-extra-work.dto';
import { ApplyExtraWorkDto } from './dto/apply-extra-work.dto';
import { CreateExtraWorkRequestDto } from './dto/create-extra-work-request.dto';
import { ListExtraWorkRequestsDto } from './dto/list-extra-work-requests.dto';
import { ExtraWorkService } from './extra-work.service';

@UseGuards(JwtAuthGuard)
@Controller('extra-work')
export class ExtraWorkController {
  constructor(private readonly extraWorkService: ExtraWorkService) {}

  @Post('requests')
  async createRequest(
    @Body() dto: CreateExtraWorkRequestDto,
    @CurrentUser() user: { id: string },
  ) {
    const request = await this.extraWorkService.createRequest(user.id, dto);
    return ok(request);
  }

  @Get('requests')
  async listRequests(
    @Query() query: ListExtraWorkRequestsDto,
    @CurrentUser() user: { id: string },
  ) {
    const requests = await this.extraWorkService.listRequestsForWorker(user.id, query.storeId);
    return ok(requests);
  }

  @Post('applications')
  async apply(@Body() dto: ApplyExtraWorkDto, @CurrentUser() user: { id: string }) {
    const application = await this.extraWorkService.apply(user.id, dto.extraWorkRequestId);
    return ok(application);
  }

  @Get('applications/me')
  async listMyApplications(@CurrentUser() user: { id: string }) {
    const applications = await this.extraWorkService.listMyApplications(user.id);
    return ok(applications);
  }

  @Get('stores/:storeId/applications')
  async listStoreApplications(
    @Param('storeId') storeId: string,
    @CurrentUser() user: { id: string },
  ) {
    const applications = await this.extraWorkService.listStoreApplications(user.id, storeId);
    return ok(applications);
  }

  @Post('applications/accept')
  async accept(@Body() dto: AcceptExtraWorkDto, @CurrentUser() user: { id: string }) {
    const application = await this.extraWorkService.accept(user.id, dto.applicationId);
    return ok(application);
  }
}
