import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

@Injectable()
export class EventPublisherService {
  constructor() {}

  async publish(eventName: string, payload: Record<string, any>) {
    console.log(`[MOCK EventPublisher] Publishing event "${eventName}":`, {
      eventId: randomUUID(),
      version: '1.0',
      occurredAt: new Date().toISOString(),
      ...payload,
    });
  }
}
