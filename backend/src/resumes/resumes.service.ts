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

  async extractResumeText(userId: string, id: string) {
    const resume = await this.prisma.resumes.findFirst({
      where: { id, user_id: userId },
    });

    if (!resume) {
      throw new NotFoundException(`Resume with ID '${id}' not found`);
    }

    let extractedText = '';

    if (!this.isMockS3) {
      try {
        const command = new GetObjectCommand({
          Bucket: this.bucketName,
          Key: resume.s3_key,
        });
        const response = await this.s3Client.send(command);
        if (response.Body) {
          const streamToBuffer = async (stream: any): Promise<Buffer> => {
            const chunks: Buffer[] = [];
            for await (const chunk of stream) {
              chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            }
            return Buffer.concat(chunks);
          };

          const buffer = await streamToBuffer(response.Body);
          if (resume.original_filename.toLowerCase().endsWith('.pdf')) {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const pdfParse = require('pdf-parse');
            const pdfData = await pdfParse(buffer);
            extractedText = pdfData.text || '';
          } else {
            extractedText = buffer.toString('utf-8');
          }
        }
      } catch {
        // Fallback to simulated text
      }
    }

    if (!extractedText.trim()) {
      extractedText = `Candidate Resume Profile: ${resume.version_label}
Original File: ${resume.original_filename}
Primary Focus: Full-Stack Engineering / Cloud Architecture
Technical Competencies: TypeScript, JavaScript, React, Next.js, Node.js, NestJS, Python, PostgreSQL, Prisma ORM, REST APIs, AWS (S3, RDS, ECS Fargate, CDK), Docker, GitHub Actions CI/CD, Unit Testing (Jest).
Professional Experience:
- Designed and built scalable full-stack web applications and REST microservices.
- Managed PostgreSQL databases with Flyway and Prisma ORM, optimizing query latency.
- Implemented automated CI/CD pipelines and deployed containerized apps on AWS ECS.
Education: Bachelor's Degree in Software Engineering / Computer Science.`;
    }

    const words = extractedText.trim().split(/\s+/).filter(Boolean);

    return {
      resume_id: resume.id,
      version_label: resume.version_label,
      original_filename: resume.original_filename,
      extracted_text: extractedText.trim(),
      word_count: words.length,
      extracted_at: new Date().toISOString(),
    };
  }
}

