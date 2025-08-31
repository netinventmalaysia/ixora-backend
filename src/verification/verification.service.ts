import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentVerification, VerificationStatus } from './document-verification.entity';
import { Business } from '../business/registration/business.entity';
import { UploadsEntity } from '../uploads/uploads.entity';
import { SftpService } from '../sftp/sftp.service';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import { MailService } from '../mail/mail.service';

@Injectable()
export class VerificationService {
  constructor(
    @InjectRepository(DocumentVerification)
    private readonly repo: Repository<DocumentVerification>,
  @InjectRepository(Business)
  private readonly businessRepo: Repository<Business>,
  @InjectRepository(UploadsEntity)
  private readonly uploadsRepo: Repository<UploadsEntity>,
  private readonly sftpService: SftpService,
  private readonly config: ConfigService,
  private readonly mail: MailService,
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

  async findLatestByBusinessId(businessId: number): Promise<DocumentVerification | null> {
    return this.repo.findOne({ where: { businessId }, order: { createdAt: 'DESC' } });
  }

  async manualReview(id: number, status: VerificationStatus, reason?: string) {
    const ver = await this.repo.findOne({ where: { id } });
    if (!ver) return null;
    ver.status = status;
    ver.reason = reason ?? null;
    const saved = await this.repo.save(ver);
    if (status === VerificationStatus.PASSED) {
      await this.businessRepo.update(ver.businessId, { status: 'Active' });
    } else if (status === VerificationStatus.FAILED || status === VerificationStatus.NEEDS_REVIEW) {
      await this.businessRepo.update(ver.businessId, { status: 'Submitted' });
    }
    return saved;
  }

  // Placeholder processing: in real life, run OCR and parse. Here we mark NEEDS_REVIEW to keep flow safe.
  async processVerification(id: number): Promise<DocumentVerification | null> {
    const ver = await this.repo.findOne({ where: { id } });
    if (!ver) return null;
    const business = await this.businessRepo.findOne({ where: { id: ver.businessId } });
    const upload = await this.uploadsRepo.findOne({ where: { id: ver.uploadId } });
    if (!business || !upload) return ver;

    try {
      // Download file from SFTP
      const uploadRoot = this.config.get<string>('SFTP_UPLOAD_DIR');
      const remotePath = path.posix.join(uploadRoot || '/', upload.path);
      await this.sftpService.connect();
      const buffer = await this.sftpService.download(remotePath);

      // Extract text: PDF via pdf-parse; images via tesseract.js
      let text = '';
      if ((upload.mimeType || '').includes('pdf') || remotePath.toLowerCase().endsWith('.pdf')) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const pdfParse = require('pdf-parse');
        const data = await pdfParse(buffer);
        text = (data.text || '').toString();
      } else if ((upload.mimeType || '').startsWith('image/') || /\.(png|jpe?g|bmp|tiff?)$/i.test(remotePath)) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Tesseract = require('tesseract.js');
  const ocrLangs = this.config.get<string>('OCR_LANGS') || 'eng+msa';
  const langPath = this.config.get<string>('OCR_LANG_PATH');
  const options = langPath ? { langPath } : undefined;
  const { data } = await Tesseract.recognize(buffer, ocrLangs, options);
        text = (data?.text || '').toString();
        if (!text.trim()) {
          ver.status = VerificationStatus.NEEDS_REVIEW;
          ver.reason = 'OCR returned no text';
          return this.repo.save(ver);
        }
      } else {
        ver.status = VerificationStatus.NEEDS_REVIEW;
        ver.reason = 'Unsupported file type for automated check';
        return this.repo.save(ver);
      }

      const normalized = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
      const textNorm = normalized(text);
      const nameNorm = normalized(business.companyName || '');
      const regNorm = (business.registrationNumber || '').replace(/\D/g, '');

      const matchCompanyName = !!(nameNorm && textNorm.includes(nameNorm));
      const matchRegistrationNumber = !!(regNorm && textNorm.includes(regNorm));

      // Try to detect an expiry date like YYYY-MM-DD or DD/MM/YYYY
      const expiry = business.expiryDate ? new Date(business.expiryDate) : null;
      let matchExpiry = null as boolean | null;
      if (expiry) {
        const y = expiry.getFullYear();
        const m = (expiry.getMonth() + 1).toString().padStart(2, '0');
        const d = expiry.getDate().toString().padStart(2, '0');
        const candidates = [
          `${y}${m}${d}`, // yyyymmdd normalized
          `${d}${m}${y}`, // ddmmyyyy normalized
        ];
        matchExpiry = candidates.some((c) => textNorm.includes(c));
      }

      ver.extractedCompanyName = matchCompanyName ? business.companyName : null;
      ver.extractedRegistrationNumber = matchRegistrationNumber ? business.registrationNumber : null;
      ver.extractedExpiryDate = matchExpiry ? (business.expiryDate as any) : null;
      ver.matchCompanyName = matchCompanyName;
      ver.matchRegistrationNumber = matchRegistrationNumber;
      ver.matchExpiry = matchExpiry;
      const checks = [matchCompanyName, matchRegistrationNumber, matchExpiry].filter((v) => v !== null);
      const passCount = checks.filter(Boolean).length;
      const totalCount = checks.length || 1;
      ver.confidence = Math.round((passCount / totalCount) * 100) / 100;

      if (matchCompanyName && matchRegistrationNumber && (matchExpiry !== false)) {
        ver.status = VerificationStatus.PASSED;
        ver.reason = null;
        await this.businessRepo.update(business.id, { status: 'Active' });
        // Notify business owner
        const owner = await this.businessRepo.findOne({ where: { id: business.id }, relations: ['user'] });
        const email = owner?.user?.email;
        if (email) {
          await this.mail.sendVerificationResultEmail(email, { businessName: business.companyName, status: 'PASSED' }).catch(() => null);
        }
      } else {
        // If clearly mismatched critical fields, mark FAILED, else NEEDS_REVIEW
        if ((!matchCompanyName && nameNorm) && (!matchRegistrationNumber && regNorm)) {
          ver.status = VerificationStatus.FAILED;
          ver.reason = 'Company name and registration number do not match the document';
          await this.businessRepo.update(business.id, { status: 'Submitted' });
          const owner = await this.businessRepo.findOne({ where: { id: business.id }, relations: ['user'] });
          const email = owner?.user?.email;
          if (email) {
            await this.mail.sendVerificationResultEmail(email, { businessName: business.companyName, status: 'FAILED', reason: ver.reason || undefined }).catch(() => null);
          }
        } else {
          ver.status = VerificationStatus.NEEDS_REVIEW;
          ver.reason = 'Automatic validation incomplete; manual review required';
          await this.businessRepo.update(business.id, { status: 'Submitted' });
        }
      }

      return this.repo.save(ver);
    } catch (err: any) {
      ver.status = VerificationStatus.NEEDS_REVIEW;
      ver.reason = 'Automated validation error: ' + (err?.message || 'unknown');
      return this.repo.save(ver);
    } finally {
      await this.sftpService.end();
    }
  }

  async listPending(params?: { statuses?: VerificationStatus[]; limit?: number; offset?: number }) {
    const statuses = params?.statuses?.length ? params.statuses : [VerificationStatus.PENDING, VerificationStatus.NEEDS_REVIEW];
    const take = Math.min(Math.max(params?.limit ?? 20, 1), 100);
    const skip = Math.max(params?.offset ?? 0, 0);
    const [data, total] = await this.repo.findAndCount({
      where: { status: statuses.length === 1 ? statuses[0] : (statuses as any) },
      relations: ['business', 'upload'],
      order: { createdAt: 'ASC' },
      take,
      skip,
    } as any);
    return { data, total, limit: take, offset: skip };
  }
}
