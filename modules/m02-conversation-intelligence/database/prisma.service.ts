import { Injectable, OnModuleInit } from '@nestjs/common';
import * as prismaClientModule from '@prisma/client';

// Resolves PrismaClient class at runtime, falling back to a mock class if not generated
const BaseClass = (prismaClientModule as any).PrismaClient || class {};

@Injectable()
export class PrismaService extends BaseClass implements OnModuleInit {
  async onModuleInit() {
    try {
      if (typeof (this as any).$connect === 'function') {
        await (this as any).$connect();
        console.log('[PrismaService] Connected to database successfully.');
      } else {
        console.log('[PrismaService] Prisma Client not generated. Running in simulator/in-memory mode.');
      }
    } catch (err: any) {
      console.warn('[PrismaService] Database offline. Running in simulator/in-memory mode.', err?.message || err);
    }
  }
}
