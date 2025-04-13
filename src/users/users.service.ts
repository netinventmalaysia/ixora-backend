import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './users.entity';

@Injectable()
export class UsersService {
    constructor(@InjectRepository(User) private repo: Repository<User>) { }

    findByUsername(username: string) {
        return this.repo.findOne({ where: { username } });
    }

    createUser(user: Partial<User>) {
        return this.repo.save(user);
    }
}
