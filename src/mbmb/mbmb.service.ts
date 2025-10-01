import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import type { AxiosRequestConfig } from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MbmbService {
  constructor(private readonly http: HttpService, private readonly config: ConfigService) { }

  private tokenCache?: { token: string; expiresAt: number };

  private parseTokenResponse(resp: any): { token?: string; expiresInSec?: number } {
    if (!resp) return {};
    const token = resp?.token || resp?.access_token || resp?.data?.token || resp?.data?.access_token;
    const expiresInSec = resp?.expires_in || resp?.data?.expires_in;
    return { token, expiresInSec };
  }

  private async fetchVendorToken(): Promise<{ token: string; ttlMs: number }> {
    const name = this.config.get<string>('MBMB_VENDOR_NAME');
    const key = this.config.get<string>('MBMB_VENDOR_KEY');
    const appName = this.config.get<string>('MBMB_VENDOR_APP_NAME');
    if (!name || !key || !appName) {
      throw new HttpException({ error: 'ConfigError', message: 'Missing MBMB vendor credentials (MBMB_VENDOR_NAME/KEY/APP_NAME)' }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    const body = { name, key, app_name: appName };
    const resp = await this.postPublicResource<any>('vendor/get-token', body, /*withAuth*/ false);
    const { token, expiresInSec } = this.parseTokenResponse(resp);
    if (!token) {
      throw new HttpException({ error: 'UpstreamError', message: 'MBMB vendor/get-token did not return a token', details: resp }, HttpStatus.BAD_GATEWAY);
    }
    const defaultTtlMs = Number(this.config.get('MBMB_TOKEN_TTL_MS') || 10 * 60 * 1000); // 10 minutes default
    const ttlMs = expiresInSec ? expiresInSec * 1000 : defaultTtlMs;
    return { token, ttlMs };
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const now = Date.now();
    if (!this.tokenCache || this.tokenCache.expiresAt <= now) {
      const { token, ttlMs } = await this.fetchVendorToken();
      this.tokenCache = { token, expiresAt: now + ttlMs - 5000 }; // refresh 5s early
    }
    return { Authorization: `Bearer ${this.tokenCache.token}` };
  }

  async request<T = any>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    options?: { params?: any; data?: any; headers?: any; config?: AxiosRequestConfig },
  ): Promise<T> {
    try {
      const response = await lastValueFrom(
        this.http.request<T>({ method, url: path, params: options?.params, data: options?.data, headers: options?.headers, ...options?.config }),
      );
      return response.data;
    } catch (err: any) {
      const status = err?.response?.status || HttpStatus.BAD_GATEWAY;
      const details = err?.response?.data;
      let message: string;
      if (typeof details === 'string') message = details;
      else if (details?.message && typeof details.message === 'string') message = details.message;
      else if (details && typeof details === 'object') message = JSON.stringify(details);
      else message = err?.message || 'MBMB request failed';
      throw new HttpException({ error: 'UpstreamError', message, details }, status);
    }
  }

  async get<T = any>(path: string, params?: any, headers?: any): Promise<T> {
    return this.request('GET', path, { params, headers });
  }

  async post<T = any>(path: string, data?: any, headers?: any): Promise<T> {
    return this.request('POST', path, { data, headers });
  }

  /**
   * Convenience helper for public MBMB endpoints under /mbmb/public/api/...
   * Example: getPublicResource('mps', { state: 'some' }) -> GET /mbmb/public/api/mps?state=some
   */
  async getPublicResource<T = any>(resourcePath: string, params?: any, withAuth: boolean = true): Promise<T> {
    const path = `/mbmb/public/api/${resourcePath}`;
    const headers = withAuth ? await this.getAuthHeaders() : undefined;
    return this.get<T>(path, params, headers);
  }

  async postPublicResource<T = any>(resourcePath: string, data?: any, withAuth: boolean = true): Promise<T> {
    const path = `/mbmb/public/api/${resourcePath}`;
    const headers = withAuth ? await this.getAuthHeaders() : undefined;
    return this.post<T>(path, data, headers);
  }
}
