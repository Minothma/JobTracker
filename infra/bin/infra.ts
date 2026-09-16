#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { NetworkStack } from '../lib/network-stack';
import { DatabaseStack } from '../lib/database-stack';
import { StorageStack } from '../lib/storage-stack';
import { ComputeStack } from '../lib/compute-stack';

const app = new cdk.App();

const env: cdk.Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
};

// 1. Network Stack (VPC, Subnets, NAT Gateway)
const networkStack = new NetworkStack(app, 'JobTrackerNetworkStack', { env });

// 2. Storage Stack (Private S3 Bucket for Resume Vault)
const storageStack = new StorageStack(app, 'JobTrackerStorageStack', { env });

// 3. Database Stack (Amazon RDS PostgreSQL 15)
const databaseStack = new DatabaseStack(app, 'JobTrackerDatabaseStack', {
  env,
  vpc: networkStack.vpc,
});

// 4. Compute Stack (ECS Fargate + ALB Routing)
const computeStack = new ComputeStack(app, 'JobTrackerComputeStack', {
  env,
  vpc: networkStack.vpc,
  databaseSecret: databaseStack.databaseSecret,
  databaseEndpoint: databaseStack.databaseInstance.dbInstanceEndpointAddress,
  resumesBucket: storageStack.resumesBucket,
});

app.synth();
