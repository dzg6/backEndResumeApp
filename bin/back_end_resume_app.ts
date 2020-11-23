#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { BackEndResumeAppStack } from '../lib/back_end_resume_app-stack';

const app = new cdk.App();
new BackEndResumeAppStack(app, 'BackEndResumeAppStack');
