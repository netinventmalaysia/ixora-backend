import { Injectable, OnModuleDestroy } from '@nestjs/common';
import * as SftpClient from 'ssh2-sftp-client';
import { ConfigService } from '@nestjs/config';
import { Client, SFTPWrapper } from 'ssh2';
import * as fs from 'fs';
@Injectable()
export class SftpService implements OnModuleDestroy {
    private client: SftpClient;

    constructor(private readonly configService: ConfigService) {
        this.client = new SftpClient();
    }

    async connect(): Promise<void> {
        const host = this.configService.get('SFTP_HOST');
        const port = +this.configService.get('SFTP_PORT');
        const username = this.configService.get('SFTP_USER');
        const password = this.configService.get('SFTP_PASS');

        if (!this.client.sftp) {
            await this.client.connect({ host, port, username, password });
        }
    }

    async upload(buffer: Buffer, remotePath: string): Promise<void> {
        await this.client.put(buffer, remotePath);
    }

    async download(remotePath: string): Promise<Buffer> {
        const content = await this.client.get(remotePath);
        if (Buffer.isBuffer(content)) return content;
        throw new Error('Downloaded content is not a buffer');
    }

    async exists(remotePath: string): Promise<boolean> {
        const exists = await this.client.exists(remotePath);
        return !!exists;
    }

    async mkdir(remotePath: string): Promise<void> {
        await this.client.mkdir(remotePath, true);
    }

    async end(): Promise<void> {
        if (this.client) {
            await this.client.end().catch(() => null);
        }
    }

    async onModuleDestroy() {
        await this.end();
    }


    async getReadStream(remotePath: string): Promise<NodeJS.ReadableStream> {
        return new Promise((resolve, reject) => {
            const conn = new Client();
            conn.on('ready', () => {
                conn.sftp((err, sftp: SFTPWrapper) => {
                    if (err) {
                        conn.end();
                        return reject(err);
                    }

                    const readStream = sftp.createReadStream(remotePath);

                    readStream.on('error', (streamErr) => {
                        conn.end();
                        reject(streamErr);
                    });

                    readStream.on('close', () => {
                        conn.end();  // Close after stream ends
                    });

                    resolve(readStream);
                });
            }).connect({
                host: this.configService.get('SFTP_HOST'),
                port: +this.configService.get('SFTP_PORT'),
                username: this.configService.get('SFTP_USER'),
                password: this.configService.get('SFTP_PASS'),
            });
        });
    }
}
