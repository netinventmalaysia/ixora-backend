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

        return `${safeFolder}/${newFilename}`;
    }
}
