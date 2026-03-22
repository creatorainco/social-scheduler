import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import 'multer';
import { makeId } from '@gitroom/nestjs-libraries/services/make.is';
import mime from 'mime-types';
// @ts-ignore
import { getExtension } from 'mime';
import { IUploadProvider } from './upload.interface';

export class S3Storage implements IUploadProvider {
  private _client: S3Client;
  private _bucket: string;
  private _prefix: string;
  private _cdnUrl: string;

  constructor(
    region: string,
    accessKeyId: string,
    secretAccessKey: string,
    bucket: string,
    prefix: string,
    cdnUrl: string
  ) {
    this._bucket = bucket;
    this._prefix = prefix;
    this._cdnUrl = cdnUrl;

    this._client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async uploadSimple(path: string) {
    const loadImage = await fetch(path);
    const contentType =
      loadImage?.headers?.get('content-type') ||
      loadImage?.headers?.get('Content-Type');
    const extension = getExtension(contentType)!;
    const id = makeId(10);
    const key = `${this._prefix}${id}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: this._bucket,
      Key: key,
      Body: Buffer.from(await loadImage.arrayBuffer()),
      ContentType: contentType,
    });

    await this._client.send(command);

    return `${this._cdnUrl}/${id}.${extension}`;
  }

  async uploadFile(file: Express.Multer.File): Promise<any> {
    try {
      const id = makeId(10);
      const extension = mime.extension(file.mimetype) || '';
      const key = `${this._prefix}${id}.${extension}`;

      const command = new PutObjectCommand({
        Bucket: this._bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await this._client.send(command);

      return {
        filename: `${id}.${extension}`,
        mimetype: file.mimetype,
        size: file.size,
        buffer: file.buffer,
        originalname: `${id}.${extension}`,
        fieldname: 'file',
        path: `${this._cdnUrl}/${id}.${extension}`,
        destination: `${this._cdnUrl}/${id}.${extension}`,
        encoding: '7bit',
        stream: file.buffer as any,
      };
    } catch (err) {
      console.error('Error uploading file to S3:', err);
      throw err;
    }
  }

  async removeFile(filePath: string): Promise<void> {
    try {
      const fileName = filePath.split('/').pop();
      if (!fileName) return;

      await this._client.send(
        new DeleteObjectCommand({
          Bucket: this._bucket,
          Key: `${this._prefix}${fileName}`,
        })
      );
    } catch (err) {
      console.error('Error removing file from S3:', err);
    }
  }
}
