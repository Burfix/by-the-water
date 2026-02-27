import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface SignedUploadResult {
  uploadUrl: string;
  s3Key: string;
  s3Bucket: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly signedUrlExpiresIn: number;

  constructor(private readonly config: ConfigService) {
    this.bucket = config.get<string>('s3.bucket');
    this.signedUrlExpiresIn = config.get<number>('s3.signedUrlExpiresIn', 3600);

    const endpoint = config.get<string>('s3.endpoint');
    this.s3 = new S3Client({
      region: config.get<string>('s3.region'),
      credentials: {
        accessKeyId: config.get<string>('s3.accessKeyId'),
        secretAccessKey: config.get<string>('s3.secretAccessKey'),
      },
      ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
    });
  }

  /**
   * Generate a pre-signed URL allowing direct browser-to-S3 PUT upload.
   */
  async getSignedUploadUrl(key: string, contentType: string): Promise<SignedUploadResult> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3, command, {
      expiresIn: this.signedUrlExpiresIn,
    });

    this.logger.debug(`Generated upload URL for key: ${key}`);

    return {
      uploadUrl,
      s3Key: key,
      s3Bucket: this.bucket,
    };
  }

  /**
   * Generate a pre-signed URL for downloading a private S3 object.
   */
  async getSignedDownloadUrl(key: string, expiresIn?: number): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.s3, command, {
      expiresIn: expiresIn ?? this.signedUrlExpiresIn,
    });
  }

  /**
   * Delete an object from S3.
   */
  async deleteObject(key: string): Promise<void> {
    try {
      await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
      this.logger.debug(`Deleted S3 object: ${key}`);
    } catch (err) {
      this.logger.error(`Failed to delete S3 object ${key}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Check if an object exists in S3.
   */
  async objectExists(key: string): Promise<boolean> {
    try {
      await this.s3.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      return true;
    } catch {
      return false;
    }
  }
}
