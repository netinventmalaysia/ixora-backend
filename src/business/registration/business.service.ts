import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Business } from './business.entity';
import { Repository } from 'typeorm';
import { CreateBusinessDto } from './dto/create-business.dto';
import { mapBusinessToListItem } from './business.mapper';
import { UploadsEntity } from '../../uploads/uploads.entity';
import { VerificationService } from '../../verification/verification.service';

@Injectable()
export class BusinessService {
    constructor(
        @InjectRepository(Business)
        private businessRepo: Repository<Business>,
        @InjectRepository(UploadsEntity)
        private uploadsRepo: Repository<UploadsEntity>,
        private readonly verificationService: VerificationService,
    ) { }

    async create(data: CreateBusinessDto): Promise<Business> {
        // Guard against duplicate registration numbers
        const existing = await this.businessRepo.findOne({ where: { registrationNumber: data.registrationNumber } });
        if (existing) {
            throw new BadRequestException('Registration number already exists');
        }
        const business = await this.businessRepo.save(this.businessRepo.create(data));

        // Trigger verification if a certificate path is provided and upload record exists
        if (business.certificateFilePath) {
            const upload = await this.uploadsRepo.findOne({ where: { path: business.certificateFilePath } });
            if (upload) {
                const ver = await this.verificationService.queueBusinessRegistrationVerification({
                    businessId: business.id,
                    uploadId: upload.id,
                    documentType: 'business_registration',
                });
                this.verificationService.processVerification(ver.id).catch(() => null);
            }
        }

        return business;
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
            relations: ['user'],
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
        if (data.registrationNumber) {
            const clash = await this.businessRepo.findOne({ where: { registrationNumber: data.registrationNumber } });
            if (clash && clash.id !== id) {
                throw new BadRequestException('Registration number already exists');
            }
        }
        await this.businessRepo.update(id, data);
        return this.findById(id);
    }

    async updateStatus(id: number, status: string) {
        await this.businessRepo.update(id, { status });
        return this.findById(id);
    }
}
