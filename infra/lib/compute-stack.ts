import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface ComputeStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  databaseSecret: secretsmanager.ISecret;
  databaseEndpoint: string;
  resumesBucket: s3.Bucket;
}

export class ComputeStack extends cdk.Stack {
  public readonly alb: elbv2.ApplicationLoadBalancer;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    // ECS Cluster
    const cluster = new ecs.Cluster(this, 'JobTrackerCluster', {
      vpc: props.vpc,
      clusterName: 'jobtracker-cluster',
    });

    // Compute Security Group for ECS Tasks
    const computeSecurityGroup = new ec2.SecurityGroup(this, 'ComputeSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for JobTracker ECS tasks',
      allowAllOutbound: true,
    });

    // Application Load Balancer
    this.alb = new elbv2.ApplicationLoadBalancer(this, 'JobTrackerALB', {
      vpc: props.vpc,
      internetFacing: true,
      loadBalancerName: 'jobtracker-alb',
    });

    const httpListener = this.alb.addListener('HttpListener', {
      port: 80,
      open: true,
    });

    // IAM Role for ECS Task Execution & S3/SES access
    const taskRole = new iam.Role(this, 'ECSTaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    // Grant S3 permissions for resume presigned uploads/downloads
    props.resumesBucket.grantReadWrite(taskRole);

    // Grant SES permissions for sending reminder emails
    taskRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['ses:SendEmail', 'ses:SendRawEmail'],
        resources: ['*'],
      }),
    );

    // ========================================================
    // Backend API Fargate Service
    // ========================================================
    const backendTaskDef = new ecs.FargateTaskDefinition(this, 'BackendTaskDef', {
      cpu: 512,
      memoryLimitMiB: 1024,
      taskRole,
    });

    const backendContainer = backendTaskDef.addContainer('BackendContainer', {
      image: ecs.ContainerImage.fromRegistry('public.ecr.aws/docker/library/node:20-alpine'),
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'jobtracker-backend' }),
      environment: {
        NODE_ENV: 'production',
        PORT: '4000',
        AWS_REGION: this.region,
        S3_BUCKET_NAME: props.resumesBucket.bucketName,
        JWT_ACCESS_EXPIRATION: '15m',
        JWT_REFRESH_EXPIRATION: '7d',
      },
      secrets: {
        DATABASE_URL: ecs.Secret.fromSecretsManager(props.databaseSecret, 'password'),
      },
    });

    backendContainer.addPortMappings({
      containerPort: 4000,
      protocol: ecs.Protocol.TCP,
    });

    const backendService = new ecs.FargateService(this, 'BackendFargateService', {
      cluster,
      taskDefinition: backendTaskDef,
      desiredCount: 1,
      minHealthyPercent: 100,
      circuitBreaker: { rollback: true },
      securityGroups: [computeSecurityGroup],
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    // ========================================================
    // Frontend Next.js Fargate Service
    // ========================================================
    const frontendTaskDef = new ecs.FargateTaskDefinition(this, 'FrontendTaskDef', {
      cpu: 512,
      memoryLimitMiB: 1024,
      taskRole,
    });

    const frontendContainer = frontendTaskDef.addContainer('FrontendContainer', {
      image: ecs.ContainerImage.fromRegistry('public.ecr.aws/docker/library/node:20-alpine'),
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'jobtracker-frontend' }),
      environment: {
        NODE_ENV: 'production',
        PORT: '5000',
        NEXT_TELEMETRY_DISABLED: '1',
      },
    });

    frontendContainer.addPortMappings({
      containerPort: 5000,
      protocol: ecs.Protocol.TCP,
    });

    const frontendService = new ecs.FargateService(this, 'FrontendFargateService', {
      cluster,
      taskDefinition: frontendTaskDef,
      desiredCount: 1,
      minHealthyPercent: 100,
      circuitBreaker: { rollback: true },
      securityGroups: [computeSecurityGroup],
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    // Route /api/* traffic to Backend Service
    httpListener.addTargets('BackendTarget', {
      priority: 10,
      conditions: [elbv2.ListenerCondition.pathPatterns(['/api/*'])],
      port: 4000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [backendService],
      healthCheck: {
        path: '/api/v1/auth/me',
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 5,
        interval: cdk.Duration.seconds(30),
      },
    });

    // Default route (/*) to Frontend Service
    httpListener.addTargets('FrontendTarget', {
      port: 5000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [frontendService],
      healthCheck: {
        path: '/',
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 5,
        interval: cdk.Duration.seconds(30),
      },
    });

    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: this.alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS Endpoint',
    });
  }
}
