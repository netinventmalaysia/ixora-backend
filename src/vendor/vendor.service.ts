import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vendor } from './vendor.entity';
import { MbmbService } from '../mbmb/mbmb.service';

@Injectable()
export class VendorService {
  constructor(
    @InjectRepository(Vendor) private readonly repo: Repository<Vendor>,
    private readonly mbmb: MbmbService,
  ) { }

  async generateKey(): Promise<{ status: boolean; message: string; key?: string }> {
    const path = 'vendor/generate-key';
    return this.mbmb.getPublicResource(path);
  }

  async createVendor(body: { name: string; key: string; app_name: string }): Promise<Vendor> {
    const path = 'vendor/create-vendor';
    const res = await this.mbmb.postPublicResource(path, body);
    const vendor = this.repo.create({
      mbmbId: res?.id ?? null,
      name: res?.name || body.name,
      role: res?.role || 'Vendor',
      status: res?.status || null,
      appName: res?.app_name || body.app_name,
      callbackPaymentUrl: res?.callback_payment_url || null,
      orderIdPrefix: res?.order_id_prefix || null,
      environment: res?.enviroment || res?.environment || null,
    });
    return this.repo.save(vendor);
  }

  async list(): Promise<Vendor[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }
}
