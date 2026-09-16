import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface DatabaseStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
}

export class DatabaseStack extends cdk.Stack {
  public readonly databaseInstance: rds.DatabaseInstance;
  public readonly databaseSecret: secretsmanager.ISecret;
  public readonly databaseSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    // Database Security Group
    this.databaseSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for PostgreSQL RDS Database',
      allowAllOutbound: true,
    });

    // Allow PostgreSQL connections from VPC subnets
    this.databaseSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(props.vpc.vpcCidrBlock),
      ec2.Port.tcp(5432),
      'Allow incoming PostgreSQL connections from within VPC',
    );

    // Database credentials in Secrets Manager
    this.databaseSecret = new rds.DatabaseSecret(this, 'DBSecret', {
      username: 'jobtracker_admin',
    });

    // Amazon RDS PostgreSQL 15 Instance
    this.databaseInstance = new rds.DatabaseInstance(this, 'PostgresInstance', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MICRO),
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [this.databaseSecurityGroup],
      credentials: rds.Credentials.fromSecret(this.databaseSecret),
      databaseName: 'jobtracker',
      allocatedStorage: 20,
      maxAllocatedStorage: 50,
      storageEncrypted: true,
      backupRetention: cdk.Duration.days(7),
      deleteAutomatedBackups: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Dev/Portfolio-friendly
      autoMinorVersionUpgrade: true,
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: this.databaseInstance.dbInstanceEndpointAddress,
      description: 'PostgreSQL RDS Endpoint Address',
    });

    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: this.databaseSecret.secretArn,
      description: 'RDS Secret ARN in Secrets Manager',
    });
  }
}
