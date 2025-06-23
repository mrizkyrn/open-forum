import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';
import { RedisConfig } from 'src/config';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private publisher: Redis;
  private subscriber: Redis;
  private subscribers = new Map<string, Function[]>();

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.connectToRedis();
  }

  onModuleDestroy() {
    this.disconnect();
  }

  private connectToRedis() {
    const redisConfig = this.configService.get<RedisConfig>('redis');
    if (!redisConfig) {
      throw new Error('Redis configuration is not defined');
    }

    const redisHost = redisConfig.host;
    const redisPort = redisConfig.port;
    const redisPassword = redisConfig.password;

    const options: RedisOptions = {
      host: redisHost,
      port: redisPort,
      lazyConnect: true,
    };

    if (redisPassword) {
      options.password = redisPassword;
    }

    this.publisher = new Redis(options);
    this.subscriber = new Redis(options);

    this.publisher
      .connect()
      .then(() => {
        this.logger.log('Redis publisher connected');
      })
      .catch((err) => {
        this.logger.error(`Failed to connect Redis publisher: ${err.message}`);
      });

    this.subscriber
      .connect()
      .then(() => {
        this.logger.log('Redis subscriber connected');
        this.setupSubscriberHandlers();
      })
      .catch((err) => {
        this.logger.error(`Failed to connect Redis subscriber: ${err.message}`);
      });
  }

  private setupSubscriberHandlers() {
    this.subscriber.on('message', (channel: string, message: string) => {
      const callbacks = this.subscribers.get(channel) || [];
      callbacks.forEach((callback) => {
        try {
          callback(message);
        } catch (error) {
          this.logger.error(`Error processing Redis message on channel ${channel}: ${error.message}`);
        }
      });
    });

    this.subscriber.on('error', (error) => {
      this.logger.error(`Redis subscriber error: ${error.message}`);
    });
  }

  async publish<T>(channel: string, message: T): Promise<number> {
    try {
      const serializedMessage = typeof message === 'string' ? message : JSON.stringify(message);
      return await this.publisher.publish(channel, serializedMessage);
    } catch (error) {
      this.logger.error(`Error publishing to Redis: ${error.message}`);
      throw error;
    }
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    try {
      // Store the callback
      if (!this.subscribers.has(channel)) {
        this.subscribers.set(channel, []);
        // Only subscribe to Redis channel if this is our first subscriber
        await this.subscriber.subscribe(channel);
        this.logger.log(`Subscribed to Redis channel: ${channel}`);
      }

      this.subscribers.get(channel)!.push(callback);
    } catch (error) {
      this.logger.error(`Error subscribing to Redis channel ${channel}: ${error.message}`);
      throw error;
    }
  }

  async unsubscribe(channel: string, callback?: Function): Promise<void> {
    if (!this.subscribers.has(channel)) {
      return;
    }

    if (callback) {
      // Remove specific callback
      const callbacks = this.subscribers.get(channel)!;
      const updatedCallbacks = callbacks.filter((cb) => cb !== callback);

      if (updatedCallbacks.length === 0) {
        // If no callbacks left, unsubscribe from the channel
        await this.subscriber.unsubscribe(channel);
        this.subscribers.delete(channel);
        this.logger.log(`Unsubscribed from Redis channel: ${channel}`);
      } else {
        this.subscribers.set(channel, updatedCallbacks);
      }
    } else {
      // Remove all callbacks and unsubscribe
      await this.subscriber.unsubscribe(channel);
      this.subscribers.delete(channel);
      this.logger.log(`Unsubscribed from Redis channel: ${channel}`);
    }
  }

  disconnect() {
    if (this.publisher) {
      this.publisher.disconnect();
    }

    if (this.subscriber) {
      this.subscriber.disconnect();
    }

    this.logger.log('Redis connections closed');
  }
}
