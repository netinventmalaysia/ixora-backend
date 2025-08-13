import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { MailService } from 'src/mail/mail.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private mailService: MailService,
    ) { }


    async findByUsername(username: string) {
        return this.userRepository.findOne({ where: { username } });
    }

    async findByEmail(email: string) {
        return this.userRepository.findOne({ where: { email } });
    }

    async createUser(createUserDto: CreateUserDto): Promise<User> {

        console.log('Creating user with data:', createUserDto);
        // 1) Prevent duplicate emails
        const existing = await this.findByEmail(createUserDto.email);
        if (existing) {
            throw new BadRequestException('User with this email already exists');
        }

        const verificationToken = uuidv4();
        const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // in UTC


        const user = this.userRepository.create(
            {
                ...createUserDto,
                isActive: true,
                isAccountVerified: false,
                isEmailVerified: false,
                verificationToken,
                verificationTokenExpires,
            } as DeepPartial<User>,
        );

        await this.userRepository.save(user);
        await this.mailService.sendVerificationEmail(user.email, verificationToken);
        return user;
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

