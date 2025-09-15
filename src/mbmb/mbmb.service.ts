import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import type { AxiosRequestConfig } from 'axios';

@Injectable()
export class MbmbService {
  constructor(private readonly http: HttpService) { }

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
      const message = err?.response?.data || err?.message || 'MBMB request failed';
      throw new HttpException({ message, details: err?.response?.data }, status);
    }
  }

  async get<T = any>(path: string, params?: any): Promise<T> {
    return this.request('GET', path, { params });
  }

  async post<T = any>(path: string, data?: any): Promise<T> {
    return this.request('POST', path, { data });
  }

  /**
   * Convenience helper for public MBMB endpoints under /mbmb/public/api/...
   * Example: getPublicResource('mps', { state: 'some' }) -> GET /mbmb/public/api/mps?state=some
   */
  async getPublicResource<T = any>(resourcePath: string, params?: any): Promise<T> {
    const path = `/mbmb/public/api/${resourcePath}`;
    return this.get<T>(path, params);
  }

  async postPublicResource<T = any>(resourcePath: string, data?: any): Promise<T> {
    const path = `/mbmb/public/api/${resourcePath}`;
    return this.post<T>(path, data);
  }
}
