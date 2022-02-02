#!/usr/bin/env node

import 'source-map-support/register'
import * as cdk from '@aws-cdk/core'
import * as ec2 from '@aws-cdk/aws-ec2'
import * as ecs from '@aws-cdk/aws-ecs'
import * as ecs_patterns from '@aws-cdk/aws-ecs-patterns'
import * as acm from '@aws-cdk/aws-certificatemanager'
import * as route53 from '@aws-cdk/aws-route53'

import { join } from 'path'

import env from './env'

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, {
      ...props,
      stackName: props?.stackName || env.required('ORIGIN_AWS_STACK_NAME')
    })

    const vpc = new ec2.Vpc(this, 'InfrastructureVpc', { maxAzs: 3 })

    const cluster = new ecs.Cluster(this, 'InfrastructureCluster', { vpc })

    const service = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'ServerService', {
      cluster,
      desiredCount: env.integer('ORIGIN_AWS_INSTANCES', 2),
      cpu: 256,
      memoryLimitMiB: 1024,
      taskImageOptions: {
        image: ecs.ContainerImage.fromAsset(join(__dirname, '../'), { exclude: [ 'node_modules', 'dist', 'exec', 'cdk.out' ] })
      },
      publicLoadBalancer: true,
      redirectHTTP: true,
      domainName: env.required('ORIGIN_AWS_SUBDOMAIN'),
      domainZone: route53.HostedZone.fromHostedZoneAttributes(this, 'InfrastructureZone', {
        zoneName: env.required('ORIGIN_AWS_HOSTED_ZONE_NAME'),
        hostedZoneId: env.required('ORIGIN_AWS_HOSTED_ZONE_ID')
      }),
      certificate: acm.Certificate.fromCertificateArn(this, 'InfrastructureCertificate', env.required('ORIGIN_AWS_CERTIFICATE_ARN'))
    })

  }
}

new CdkStack(new cdk.App(), 'CdkStack')
