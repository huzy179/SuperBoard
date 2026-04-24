import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private prisma: PrismaService) {}

  async checkDatabase(): Promise<void> {
    await this.prisma.$queryRaw`SELECT 1`;
  }
}
