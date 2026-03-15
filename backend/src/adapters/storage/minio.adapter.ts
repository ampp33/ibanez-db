import { Client as MinioClient } from 'minio';
import { env } from '../../config/env';
import type { StorageAdapter } from './storage.interface';
import { logger } from '../../config/logger';

/**
 * S3-compatible storage adapter using the MinIO client.
 * Works with both MinIO and AWS S3 by adjusting env config.
 */
export class MinioStorageAdapter implements StorageAdapter {
  private client: MinioClient;
  private bucket: string;

  constructor() {
    const isS3 = env.storage.provider === 's3';

    this.client = new MinioClient({
      endPoint: env.storage.endpoint,
      port: isS3 ? undefined : env.storage.port,
      useSSL: isS3 ? true : env.storage.useSsl,
      accessKey: env.storage.accessKey,
      secretKey: env.storage.secretKey,
      ...(isS3 ? { region: env.storage.region } : {}),
    });

    this.bucket = env.storage.bucket;
  }

  async ensureBucket(): Promise<void> {
    const exists = await this.client.bucketExists(this.bucket);
    if (!exists) {
      await this.client.makeBucket(this.bucket, env.storage.region);
      logger.info(`Created bucket: ${this.bucket}`);

      // Set public read policy for the bucket
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${this.bucket}/*`],
          },
        ],
      };
      await this.client.setBucketPolicy(this.bucket, JSON.stringify(policy));
      logger.info(`Set public read policy on bucket: ${this.bucket}`);
    }
  }

  async upload(key: string, data: Buffer, contentType: string): Promise<string> {
    await this.client.putObject(this.bucket, key, data, data.length, {
      'Content-Type': contentType,
    });
    logger.debug(`Uploaded: ${key} (${data.length} bytes)`);
    return key;
  }

  async delete(key: string): Promise<void> {
    await this.client.removeObject(this.bucket, key);
    logger.debug(`Deleted: ${key}`);
  }

  getPublicUrl(key: string): string {
    const isS3 = env.storage.provider === 's3';
    if (isS3) {
      return `https://${this.bucket}.s3.${env.storage.region}.amazonaws.com/${key}`;
    }
    const protocol = env.storage.useSsl ? 'https' : 'http';
    return `${protocol}://${env.storage.endpoint}:${env.storage.port}/${this.bucket}/${key}`;
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.statObject(this.bucket, key);
      return true;
    } catch {
      return false;
    }
  }
}
