import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
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
                role: createUserDto.role ?? UserRole.PERSONAL,
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

    async findByVerificationToken(token: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { verificationToken: token } });
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

    // Admin: list users with optional search/role and pagination
    async adminListUsers(params: { search?: string; role?: UserRole; limit?: number; offset?: number }) {
        const { search, role, limit = 20, offset = 0 } = params || {} as any;
        console.log('Admin listing users with params:', params);
            const qb = this.userRepository.createQueryBuilder('u');
            // Select only non-sensitive fields
            qb.select([
                'u.id',
                'u.email',
                'u.firstName',
                'u.lastName',
                'u.isActive',
                'u.isEmailVerified',
                'u.role',
                'u.lastLogin',
                'u.createdAt',
            ]);
        if (search) {
            qb.andWhere('(u.email LIKE :q OR u.firstName LIKE :q OR u.lastName LIKE :q)', { q: `%${search}%` });
        }
        if (role) {
            qb.andWhere('u.role = :role', { role });
        }
        qb.orderBy('u.id', 'DESC');
        qb.skip(offset).take(limit);
        const [data, total] = await qb.getManyAndCount();
        return { data, total, limit, offset };
    }

    // Admin: update user role
    async adminUpdateUserRole(id: number, role: UserRole) {
        const user = await this.findById(id);
        user.role = role;
        return this.userRepository.save(user);
    }
}

