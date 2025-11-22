import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';

@Injectable()
export class HealthService {
  constructor(
    @InjectConnection()
    private connection: Connection,
  ) {}

  async check() {
    const dbStatus = await this.checkDatabase();
    
    return {
      status: dbStatus ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbStatus ? 'connected' : 'disconnected',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB',
      },
    };
  }

  async ready() {
    const dbReady = await this.checkDatabase();
    
    return {
      ready: dbReady,
      timestamp: new Date().toISOString(),
      checks: {
        database: dbReady,
      },
    };
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      await this.connection.query('SELECT 1');
      return true;
    } catch (error) {
      return false;
    }
  }
}

