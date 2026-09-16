import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class StorageStack extends cdk.Stack {
  public readonly resumesBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Private S3 Bucket for Resume Version Vault with CORS for presigned uploads
    this.resumesBucket = new s3.Bucket(this, 'ResumesBucket', {
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST, s3.HttpMethods.HEAD],
          allowedOrigins: ['*'], // In production, lock down to frontend domain
          allowedHeaders: ['*'],
          exposedHeaders: ['ETag', 'x-amz-server-side-encryption'],
          maxAge: 3600,
        },
      ],
      lifecycleRules: [
        {
          id: 'AbortIncompleteMultipartUploads',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(1),
        },
      ],
    });

    new cdk.CfnOutput(this, 'ResumesBucketName', {
      value: this.resumesBucket.bucketName,
      description: 'S3 Bucket Name for Resumes Vault',
    });
  }
}
