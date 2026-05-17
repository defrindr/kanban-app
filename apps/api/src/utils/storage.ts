import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';

export interface StorageProvider {
  save(key: string, buffer: Buffer, mimetype: string): Promise<string>;
  delete(key: string): Promise<void>;
  getUrl(key: string): Promise<string>;
}

class LocalStorage implements StorageProvider {
  constructor(private baseDir: string) {
    if (!existsSync(baseDir)) {
      void mkdir(baseDir, { recursive: true });
    }
  }

  async save(key: string, buffer: Buffer): Promise<string> {
    const fullPath = join(this.baseDir, key);
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, buffer);
    return `/uploads/${key}`;
  }

  async delete(key: string): Promise<void> {
    try {
      await unlink(join(this.baseDir, key));
    } catch {
      // Ignore: file may not exist
    }
  }

  async getUrl(key: string): Promise<string> {
    return `/uploads/${key}`;
  }
}

class S3Storage implements StorageProvider {
  private client: S3Client;
  private bucket: string;
  private expiresIn: number;

  constructor() {
    this.client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
    this.bucket = process.env.S3_BUCKET!;
    this.expiresIn = parseInt(process.env.S3_URL_EXPIRY || '604800', 10);
  }

  async save(key: string, buffer: Buffer, mimetype: string): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimetype,
      })
    );
    return this.getUrl(key);
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      );
    } catch {
      // Ignore: delete may fail if object doesn't exist
    }
  }

  async getUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client, command, { expiresIn: this.expiresIn });
  }
}

let _storage: StorageProvider | null = null;

export function createStorage(): StorageProvider {
  if (_storage) return _storage;

  if (process.env.S3_BUCKET && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    _storage = new S3Storage();
  } else {
    const dir = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads');
    _storage = new LocalStorage(dir);
  }
  return _storage;
}

export const storage = createStorage();
