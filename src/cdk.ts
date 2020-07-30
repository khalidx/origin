#!/usr/bin/env node

import 'source-map-support/register'
import * as cdk from '@aws-cdk/core'
import * as ec2 from '@aws-cdk/aws-ec2'
import * as ecs from '@aws-cdk/aws-ecs'
import * as ecs_patterns from '@aws-cdk/aws-ecs-patterns'
import * as elbv2 from '@aws-cdk/aws-elasticloadbalancingv2'
import * as acm from '@aws-cdk/aws-certificatemanager'
import * as route53 from '@aws-cdk/aws-route53'

import { join } from 'path'

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const required = (name: string): string => {
      const value = process.env[name]
      if (!value) throw new Error(`The environment variable "${name}" is required for deployment.`)
      return value
    }

    const configuration = {
      subdomian: required('ORIGIN_AWS_SUBDOMAIN'),
      hostedZone: {
        zoneName: required('ORIGIN_AWS_HOSTED_ZONE_NAME'),
        hostedZoneId: required('ORIGIN_AWS_HOSTED_ZONE_ID')
      },
      certificate: required('ORIGIN_AWS_CERTIFICATE_ARN')
    }

    const vpc = new ec2.Vpc(this, 'InfrastructureVpc', { maxAzs: 3 })

    const cluster = new ecs.Cluster(this, 'InfrastructureCluster', { vpc })

    const service = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'ServerService', {
      cluster,
      desiredCount: 2,
      cpu: 256,
      memoryLimitMiB: 1024,
      taskImageOptions: {
        image: ecs.ContainerImage.fromAsset(join(__dirname, '../'), { exclude: [ 'node_modules', 'dist', 'exec', 'cdk.out' ] })
      },
      publicLoadBalancer: true,
      domainName: configuration.subdomian,
      domainZone: route53.HostedZone.fromHostedZoneAttributes(this, 'InfrastructureZone', configuration.hostedZone),
      certificate: acm.Certificate.fromCertificateArn(this, 'InfrastructureCertificate', configuration.certificate)
    })

    service
    .loadBalancer
    .addListener('HttpListener', { protocol: elbv2.ApplicationProtocol.HTTP, port: 80 })
    .addRedirectResponse('HttpRedirect', { statusCode: 'HTTP_301', protocol: elbv2.ApplicationProtocol.HTTPS, port: '443' })
  }
}

new CdkStack(new cdk.App(), 'CdkStack')
