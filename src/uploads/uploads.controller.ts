import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  Get,
  Param,
  Res,
  NotFoundException,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { UploadsEntity } from './uploads.entity';
import { multerOptions } from './multer.options';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import * as SftpClient from 'ssh2-sftp-client';
import * as path from 'path';
import * as mime from 'mime-types';
import { SftpService } from '../sftp/sftp.service';

@Controller('uploads')
export class UploadsController {
  constructor(
    private readonly uploadsService: UploadsService,
    private readonly configService: ConfigService,
    private readonly sftpService: SftpService
  ) { }

  @Post('file')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder: string,
    @Body('businessId') businessId?: number,
    @Body('documentType') documentType?: string,
    @Body('description') description?: string,
    @Body('userId') userId?: number,
  ): Promise<UploadsEntity> {
    const saved = await this.uploadsService.uploadFile(file, folder, { businessId, userId, documentType, description });
    return saved;
  }

  @Get('file/*path')
  async getFile(@Param('path') pathParam: string, @Res() res: Response) {
    if (!pathParam) throw new NotFoundException('No path provided');

    const filepath = decodeURIComponent(pathParam).replace(/,/g, '/');
    const uploadDir = this.configService.get('SFTP_UPLOAD_DIR');

    try {
      await this.sftpService.connect();
      const remotePath = path.posix.join(uploadDir, filepath);

      const fileExists = await this.sftpService.exists(remotePath);
      if (!fileExists) throw new NotFoundException('File not found');

      //const fileContent = await this.sftpService.download(remotePath);
      const readStream = await this.sftpService.getReadStream(remotePath);
      const contentType = mime.lookup(filepath) || 'application/octet-stream';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      //res.send(fileContent);
      readStream.pipe(res);
    } catch (err) {
      console.error('SFTP error:', err.message);
      throw new NotFoundException('File not found or SFTP error');
    } finally {
      await this.sftpService.end();
    }

  }



}
