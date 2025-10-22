import { Controller, Post, Body, Get, Param, Patch, Put, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiOkResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';
import { UserService } from './user.service';
import { User } from './user.entity';
import { plainToInstance } from 'class-transformer';
import { UserResponseDto } from './dto/user-response.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@ApiTags('Users') // Group name in Swagger UI
@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new user' })
    @ApiBody({ type: CreateUserDto })
    @ApiOkResponse({ type: UserResponseDto })
    async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
        console.log('Creating user with data:', createUserDto);
        const user = await this.userService.createUser(createUserDto);
        return plainToInstance(UserResponseDto, user);
    }


    @Get('profile/:id')
    async getUserById(@Param('id') id: number) {
        console.log('Fetching user by ID:', id);
        return this.userService.findById(id);
    }

    @Put('profile/:id')
    async updateUser(@Param('id') id: number, @Body() dto: UpdateUserDto) {
        console.log('Updating user with ID:', id, 'Data:', dto);
        return this.userService.updateUser(id, dto);
    }


    @Get()
    async getUserByEmail(@Query('email') email: string) {
        if (!email) return null;
        const user = await this.userService.findByEmail(email);
        if (!user) return null;
        return plainToInstance(UserResponseDto, user);
    }

    // Admin: list users
    @Get('admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @ApiBearerAuth('bearer')
    async adminList(
        @Query('search') search?: string,
        @Query('role') role?: string,
        @Query('limit') limit?: number,
        @Query('offset') offset?: number,
    ) {
        const result = await this.userService.adminListUsers({
            search,
            role: role as any,
            limit: typeof limit === 'number' ? limit : Number(limit ?? 20),
            offset: typeof offset === 'number' ? offset : Number(offset ?? 0),
        });
        return result;
    }

    // Admin: update role
    @Patch(':id/role')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @ApiBearerAuth('bearer')
    async adminUpdateRole(@Param('id') id: number, @Body() dto: UpdateUserRoleDto) {
        const user = await this.userService.adminUpdateUserRole(Number(id), dto.role as any);
        return plainToInstance(UserResponseDto, user);
    }

    // Keep dynamic username route last to avoid shadowing static routes like 'admin'
    @Get(':username')
    @ApiOkResponse({ type: UserResponseDto })
    async getUser(@Param('username') username: string): Promise<UserResponseDto> {
        const user = await this.userService.findByUsername(username);
        return plainToInstance(UserResponseDto, user);
    }

}