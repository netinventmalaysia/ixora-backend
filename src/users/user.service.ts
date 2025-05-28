import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) { }


    async findByUsername(username: string) {
        return this.userRepository.findOne({ where: { username } });
    }

    async createUser(createUserDto: CreateUserDto): Promise<User> {

        const user = this.userRepository.create({
            ...createUserDto,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        return await this.userRepository.save(user);
    }
}
