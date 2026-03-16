import { decodeTime, isValid, monotonicFactory, ulid } from 'ulid';

const monotonicUlid = monotonicFactory();

export function createUlid(): string {
  return ulid();
}

export function createSortableUlid(): string {
  return monotonicUlid();
}

export function isUlid(value: string): boolean {
  return isValid(value);
}

export function getUlidTimestamp(value: string): number {
  return decodeTime(value);
}
