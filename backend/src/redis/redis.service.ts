import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis | null = null;
  private isConnected = false;
  private isEnabled: boolean;

  constructor(private configService: ConfigService) {
    // Redis is optional - check if it's enabled
    this.isEnabled = this.configService.get('REDIS_ENABLED', 'false') === 'true';
  }

  async onModuleInit() {
    if (!this.isEnabled) {
      console.log('ℹ️  Redis is disabled (set REDIS_ENABLED=true to enable)');
      return;
    }

    const redisHost = this.configService.get('REDIS_HOST', 'localhost');
    const redisPort = this.configService.get('REDIS_PORT', 6379);
    const redisPassword = this.configService.get('REDIS_PASSWORD');

    try {
      this.client = new Redis({
        host: redisHost,
        port: parseInt(redisPort.toString()),
        password: redisPassword,
        retryStrategy: (times) => {
          // Stop retrying after 5 attempts
          if (times > 5) {
            console.warn('⚠️  Redis connection failed after multiple attempts. Continuing without Redis.');
            return null; // Stop retrying
          }
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
        lazyConnect: true, // Don't connect immediately
        enableOfflineQueue: false, // Don't queue commands when offline
      });

      this.client.on('error', (err: any) => {
        if (err?.code !== 'ECONNREFUSED') {
          console.error('Redis Client Error:', err?.message || err);
        }
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('✅ Redis connected');
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        console.log('✅ Redis ready');
        this.isConnected = true;
      });

      this.client.on('close', () => {
        console.log('⚠️  Redis connection closed');
        this.isConnected = false;
      });

      // Try to connect
      await this.client.connect();
    } catch (error) {
      console.warn('⚠️  Redis connection failed. Continuing without Redis cache.');
      console.warn('   To enable Redis, start the container: docker compose up -d redis');
      this.client = null;
      this.isConnected = false;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
    }
  }

  private checkConnection(): boolean {
    if (!this.isEnabled || !this.client || !this.isConnected) {
      return false;
    }
    return true;
  }

  getClient(): Redis | null {
    return this.checkConnection() ? this.client : null;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.checkConnection()) return;
    try {
      if (ttlSeconds) {
        await this.client!.setex(key, ttlSeconds, value);
      } else {
        await this.client!.set(key, value);
      }
    } catch (error) {
      // Silently fail if Redis is unavailable
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.checkConnection()) return null;
    try {
      return await this.client!.get(key);
    } catch (error) {
      return null;
    }
  }

  async del(key: string): Promise<void> {
    if (!this.checkConnection()) return;
    try {
      await this.client!.del(key);
    } catch (error) {
      // Silently fail if Redis is unavailable
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.checkConnection()) return false;
    try {
      const result = await this.client!.exists(key);
      return result === 1;
    } catch (error) {
      return false;
    }
  }

  async expire(key: string, seconds: number): Promise<void> {
    if (!this.checkConnection()) return;
    try {
      await this.client!.expire(key, seconds);
    } catch (error) {
      // Silently fail if Redis is unavailable
    }
  }

  async increment(key: string, ttlSeconds?: number): Promise<number> {
    if (!this.checkConnection()) return 0;
    try {
      const result = await this.client!.incr(key);
      if (ttlSeconds && result === 1) {
        await this.client!.expire(key, ttlSeconds);
      }
      return result;
    } catch (error) {
      return 0;
    }
  }
}

