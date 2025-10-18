import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MySkbOwnershipService } from './ownership.service';
import { InviteOwnershipDto, ListOwnershipQueryDto, UpdateOwnershipDto } from './dto/ownership.dto';

@ApiTags('MySKB Ownership')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('business', 'admin')
@Controller('myskb/ownership')
export class MySkbOwnershipController {
  constructor(private readonly service: MySkbOwnershipService) { }

  @Get()
  list(@Query() query: ListOwnershipQueryDto & { businessId?: number }) {
    // Support both business_id and businessId
    if (!query.business_id && (query as any).businessId) {
      (query as any).business_id = Number((query as any).businessId);
    }
    if (!query.limit) (query as any).limit = 50;
    if (!query.offset) (query as any).offset = 0;
    return this.service.list(query as ListOwnershipQueryDto);
  }

  @Post('invite')
  invite(@Body() body: InviteOwnershipDto) {
    return this.service.invite(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateOwnershipDto) {
    return this.service.update(parseInt(id, 10), body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(parseInt(id, 10));
  }

  @Get('access')
  @Roles('business', 'admin', 'personal', 'consultant')
  access(@Query('business_id') bid: string, @Req() req: any) {
    const userId: number | undefined = req.user?.userId ?? req.user?.id ?? req.user?.sub;
    return this.service.access(parseInt(bid, 10), userId);
  }
}
