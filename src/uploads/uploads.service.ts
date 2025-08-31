import { Injectable } from '@nestjs/common';
import * as SftpClient from 'ssh2-sftp-client';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UploadsEntity } from './uploads.entity';
import { VerificationService } from '../verification/verification.service';

@Injectable()
export class UploadsService {
    private sftp: SftpClient;

    constructor(
        private configService: ConfigService,
        @InjectRepository(UploadsEntity) private readonly uploadsRepo: Repository<UploadsEntity>,
        private readonly verificationService: VerificationService,
    ) {
        this.sftp = new SftpClient();
    }

    async uploadFile(file: Express.Multer.File, folder: string, options?: { businessId?: number; userId?: number; documentType?: string; description?: string; }): Promise<UploadsEntity> {
        const host = this.configService.get('SFTP_HOST');
        const port = +this.configService.get('SFTP_PORT');
        const username = this.configService.get('SFTP_USER');
        const password = this.configService.get('SFTP_PASS');
        const uploadRoot = this.configService.get('SFTP_UPLOAD_DIR');

        console.log('SFTP USER:', username);
        console.log('Uploading to SFTP:', host, port, uploadRoot);

        const safeFolder = folder.replace(/\.\./g, '').replace(/^\/+/, '');
        const remoteFolderPath = path.posix.join(uploadRoot, safeFolder);

        const ext = path.extname(file.originalname);
        const nameWithoutExt = path.basename(file.originalname, ext);
        const timestamp = Date.now();
    const newFilename = `${timestamp}${ext}`
        const remoteFilePath = path.posix.join(remoteFolderPath, newFilename);

        console.log('Creating folder:', remoteFolderPath);
        console.log('Uploading file:', remoteFilePath);

        await this.sftp.connect({ host, port, username, password });

        try {
            await this.sftp.mkdir(remoteFolderPath, true);
            await this.sftp.put(file.buffer, remoteFilePath);
        } finally {
            await this.sftp.end();
        }

        const record = this.uploadsRepo.create({
            storage: 'sftp',
            originalName: file.originalname,
            filename: newFilename,
            path: `${safeFolder}/${newFilename}`,
            folder: safeFolder,
            mimeType: file.mimetype,
            size: file.size,
            businessId: options?.businessId ?? null,
            userId: options?.userId ?? null,
            documentType: options?.documentType ?? null,
            description: options?.description ?? null,
        });
        const saved = await this.uploadsRepo.save(record);

        // Queue verification for business registration documents
        if (saved.businessId && saved.documentType === 'business_registration') {
            const ver = await this.verificationService.queueBusinessRegistrationVerification({
                businessId: saved.businessId,
                uploadId: saved.id,
                documentType: saved.documentType,
            });
            // Fire-and-forget processing (placeholder). In production, use a queue.
            this.verificationService.processVerification(ver.id).catch(() => null);
        }

        return saved;
    }
}
