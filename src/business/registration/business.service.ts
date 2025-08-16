import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Business } from './business.entity';
import { Repository } from 'typeorm';
import { CreateBusinessDto } from './dto/create-business.dto';
import { mapBusinessToListItem } from './business.mapper';

@Injectable()
export class BusinessService {
    constructor(
        @InjectRepository(Business)
        private businessRepo: Repository<Business>,
    ) { }

    async create(data: CreateBusinessDto): Promise<Business> {
        const business = this.businessRepo.create(data);
        return this.businessRepo.save(business);
    }

    async findByUser(userId: number) {
        return this.businessRepo.find({
            where: { /* createdBy: userId */ }, // Add filter if needed
            order: { createdAt: 'DESC' },
        });
    }

    async findAllMappedByUser(userId: number) {
        const businesses = await this.businessRepo.find({
            where: { /* createdBy: userId */ },  // Add if you have relation
            order: { createdAt: 'DESC' },
        });

        return businesses.map(mapBusinessToListItem);
    }

    async findById(id: number) {
        const business = await this.businessRepo.findOne({
            where: { id },
        });

        if (!business) {
            throw new Error('Business not found');
        }

        return business;
    }

    async update(id: number, data: CreateBusinessDto) {
        await this.businessRepo.update(id, data);
        return this.findById(id);
    }
}
