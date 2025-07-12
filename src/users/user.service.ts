import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) { }


    async findByUsername(username: string) {
        return this.userRepository.findOne({ where: { username } });
    }

    async findByEmail(email: string) {
        return this.userRepository.findOne({ where: { email } });
    }

    async createUser(createUserDto: CreateUserDto): Promise<User> {

        const user = this.userRepository.create({
            ...createUserDto,
            isActive: true,
            isAccountVerified: false,
            isEmailVerified: false,
        });
        return await this.userRepository.save(user);
    }
}
