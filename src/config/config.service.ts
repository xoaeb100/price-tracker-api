import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfigService {
  getNumber(name: string, fallback?: number): number {
    const v = process.env[name];
    return v ? Number(v) : (fallback as number);
  }
  getString(name: string, fallback?: string): string {
    return process.env[name] ?? (fallback as string);
  }
  getBoolean(name: string, fallback = false): boolean {
    const v = process.env[name];
    if (v === undefined) return fallback;
    return ['1', 'true', 'yes'].includes(v.toLowerCase());
  }
}
