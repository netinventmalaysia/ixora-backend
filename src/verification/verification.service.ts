import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentVerification, VerificationStatus } from './document-verification.entity';

@Injectable()
export class VerificationService {
  constructor(
    @InjectRepository(DocumentVerification)
    private readonly repo: Repository<DocumentVerification>,
  ) {}

  async queueBusinessRegistrationVerification(params: {
    businessId: number;
    uploadId: number;
    documentType: string;
  }): Promise<DocumentVerification> {
    const record = this.repo.create({
      businessId: params.businessId,
      uploadId: params.uploadId,
      documentType: params.documentType,
      status: VerificationStatus.PENDING,
    });
    return this.repo.save(record);
  }
}
