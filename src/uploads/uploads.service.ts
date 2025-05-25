import { Injectable } from '@nestjs/common';
import * as SftpClient from 'ssh2-sftp-client';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';

@Injectable()
export class UploadsService {
    private sftp: SftpClient;

    constructor(private configService: ConfigService) {
        this.sftp = new SftpClient();
    }

    async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
        const host = this.configService.get('SFTP_HOST');
        const port = +this.configService.get('SFTP_PORT');
        const username = this.configService.get('SFTP_USER');
        const password = this.configService.get('SFTP_PASS');
        const uploadDir = this.configService.get('SFTP_UPLOAD_DIR');

        // Extract file extension
        const ext = path.extname(file.originalname);
        const nameWithoutExt = path.basename(file.originalname, ext);

        // Generate unique filename with timestamp
        const timestamp = Date.now();
        const newFilename = `${nameWithoutExt}_${timestamp}${ext}`;
        const remotePath = `${uploadDir}/${folder}/${newFilename}`;

        await this.sftp.connect({ host, port, username, password });
        await this.sftp.mkdir(`${uploadDir}/${folder}`, true); // Recursive mkdir
        await this.sftp.put(file.buffer, remotePath);
        await this.sftp.end();

        return remotePath;
    }
}
