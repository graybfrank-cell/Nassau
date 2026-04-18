import { Capacitor } from '@capacitor/core';

export function getApiBase(): string {
  if (Capacitor.isNativePlatform()) {
    return 'https://nassau.golf';
  }
  return '';
}

export function apiUrl(path: string): string {
  return `${getApiBase()}${path}`;
}
