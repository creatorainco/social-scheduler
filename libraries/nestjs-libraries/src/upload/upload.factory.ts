import { CloudflareStorage } from './cloudflare.storage';
import { IUploadProvider } from './upload.interface';
import { LocalStorage } from './local.storage';
import { S3Storage } from './s3.storage';

export class UploadFactory {
  static createStorage(): IUploadProvider {
    const storageProvider = process.env.STORAGE_PROVIDER || 'local';

    switch (storageProvider) {
      case 'local':
        return new LocalStorage(process.env.UPLOAD_DIRECTORY!);
      case 'cloudflare':
        return new CloudflareStorage(
          process.env.CLOUDFLARE_ACCOUNT_ID!,
          process.env.CLOUDFLARE_ACCESS_KEY!,
          process.env.CLOUDFLARE_SECRET_ACCESS_KEY!,
          process.env.CLOUDFLARE_REGION!,
          process.env.CLOUDFLARE_BUCKETNAME!,
          process.env.CLOUDFLARE_BUCKET_URL!
        );
      case 's3':
        return new S3Storage(
          process.env.AWS_S3_REGION || 'us-east-1',
          process.env.AWS_ACCESS_KEY_ID!,
          process.env.AWS_SECRET_ACCESS_KEY!,
          process.env.AWS_S3_BUCKET!,
          process.env.AWS_S3_PREFIX || 'social/',
          process.env.CDN_URL || `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com`
        );
      default:
        throw new Error(`Invalid storage type ${storageProvider}`);
    }
  }
}
