import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
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
  constructor(private readonly service: MySkbOwnershipService) {}

  @Get()
  list(@Query() query: ListOwnershipQueryDto) {
    return this.service.list(query);
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
  access(@Query('business_id') bid: string) {
    return this.service.access(parseInt(bid, 10));
  }
}
