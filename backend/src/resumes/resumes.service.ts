import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PrismaService } from '../prisma/prisma.service';
import { GetUploadUrlDto } from './dto/get-upload-url.dto';

@Injectable()
export class ResumesService {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly isMockS3: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const region = this.configService.get<string>('AWS_REGION') || 'us-east-1';
    this.bucketName = this.configService.get<string>('S3_BUCKET_NAME') || 'jobtracker-resumes-dev';
    
    // Check if real AWS credentials or mock mode
    const hasAwsCreds = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;
    this.isMockS3 = !hasAwsCreds && process.env.NODE_ENV !== 'production';

    this.s3Client = new S3Client({
      region,
      ...(this.isMockS3 ? {
        endpoint: process.env.LOCALSTACK_ENDPOINT || undefined,
        credentials: {
          accessKeyId: 'mock-key',
          secretAccessKey: 'mock-secret',
        },
      } : {}),
    });
  }

  async findAll(userId: string) {
    const resumes = await this.prisma.resumes.findMany({
      where: { user_id: userId },
      orderBy: { uploaded_at: 'desc' },
      include: {
        _count: {
          select: { applications: true },
        },
      },
    });

    // Attach temporary download URL for each resume
    return Promise.all(
      resumes.map(async (resume) => {
        let downloadUrl = '';
        try {
          if (!this.isMockS3) {
            const command = new GetObjectCommand({
              Bucket: this.bucketName,
              Key: resume.s3_key,
              ResponseContentDisposition: `attachment; filename="${resume.original_filename}"`,
            });
            downloadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
          } else {
            downloadUrl = `https://mock-s3.local/${this.bucketName}/${resume.s3_key}`;
          }
        } catch {
          downloadUrl = '';
        }

        return {
          ...resume,
          download_url: downloadUrl,
        };
      }),
    );
  }

  async findOne(userId: string, id: string) {
    const resume = await this.prisma.resumes.findFirst({
      where: { id, user_id: userId },
      include: {
        applications: {
          select: {
            id: true,
            company_name: true,
            role_title: true,
            status: true,
          },
        },
      },
    });

    if (!resume) {
      throw new NotFoundException(`Resume with ID '${id}' not found`);
    }

    let downloadUrl = '';
    try {
      if (!this.isMockS3) {
        const command = new GetObjectCommand({
          Bucket: this.bucketName,
          Key: resume.s3_key,
          ResponseContentDisposition: `attachment; filename="${resume.original_filename}"`,
        });
        downloadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
      } else {
        downloadUrl = `https://mock-s3.local/${this.bucketName}/${resume.s3_key}`;
      }
    } catch {
      downloadUrl = '';
    }

    return {
      ...resume,
      download_url: downloadUrl,
    };
  }

  async getPresignedUploadUrl(userId: string, dto: GetUploadUrlDto) {
    const sanitizedFilename = dto.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const tempKey = `resumes/${userId}/${Date.now()}-${sanitizedFilename}`;

    // Create DB record with status / metadata
    const resume = await this.prisma.resumes.create({
      data: {
        user_id: userId,
        version_label: dto.version_label.trim(),
        original_filename: dto.filename,
        s3_key: tempKey,
      },
    });

    let uploadUrl = '';
    try {
      if (!this.isMockS3) {
        const command = new PutObjectCommand({
          Bucket: this.bucketName,
          Key: tempKey,
          ContentType: 'application/pdf',
        });
        uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 900 });
      } else {
        uploadUrl = `https://mock-s3.local/${this.bucketName}/${tempKey}?mock_presigned=true`;
      }
    } catch (error) {
      // If presigned URL generation fails, delete the created record
      await this.prisma.resumes.delete({ where: { id: resume.id } });
      throw new InternalServerErrorException('Failed to generate presigned upload URL');
    }

    return {
      resume_id: resume.id,
      upload_url: uploadUrl,
      s3_key: tempKey,
      expires_in_seconds: 900,
    };
  }

  async confirmUpload(userId: string, id: string) {
    const resume = await this.prisma.resumes.findFirst({
      where: { id, user_id: userId },
    });

    if (!resume) {
      throw new NotFoundException(`Resume with ID '${id}' not found`);
    }

    // Update timestamp
    return this.prisma.resumes.update({
      where: { id },
      data: { uploaded_at: new Date() },
    });
  }

  async remove(userId: string, id: string) {
    const resume = await this.prisma.resumes.findFirst({
      where: { id, user_id: userId },
    });

    if (!resume) {
      throw new NotFoundException(`Resume with ID '${id}' not found`);
    }

    // Delete object from S3 if configured
    try {
      if (!this.isMockS3) {
        const command = new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: resume.s3_key,
        });
        await this.s3Client.send(command);
      }
    } catch {
      // Continue even if S3 delete fails (or file was missing)
    }

    await this.prisma.resumes.delete({
      where: { id },
    });

    return { message: 'Resume deleted successfully' };
  }
}
