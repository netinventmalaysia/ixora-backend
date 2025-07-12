import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiOkResponse } from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';
import { UserService } from './user.service';
import { User } from './user.entity';
import { plainToInstance } from 'class-transformer';
import { UserResponseDto } from './dto/user-response.dto';

@ApiTags('Users') // Group name in Swagger UI
@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new user' })
    @ApiBody({ type: CreateUserDto })
    @ApiOkResponse({ type: UserResponseDto })
    async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
        const user = this.userService.createUser(createUserDto);
        return plainToInstance(UserResponseDto, user);
    }

    @Get(':username')
    @ApiOkResponse({ type: UserResponseDto })
    async getUser(@Param('username') username: string): Promise<UserResponseDto> {
        const user = await this.userService.findByUsername(username);
        return plainToInstance(UserResponseDto, user);
    }

}