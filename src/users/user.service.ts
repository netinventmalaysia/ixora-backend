import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

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

    async save(user: User): Promise<User> {
        return this.userRepository.save(user);
    }

    async findByResetToken(token: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { resetToken: token } });
    }

    async findById(id: number): Promise<User> {
        const user = await this.userRepository.findOneBy({ id });
        if (!user) throw new NotFoundException('User not found');
        return user;
    }
    async updateUser(id: number, dto: UpdateUserDto): Promise<User> {
        const user = await this.findById(id);
        Object.assign(user, dto);
        return this.userRepository.save(user);
    }
}
