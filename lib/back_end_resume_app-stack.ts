import * as cdk from '@aws-cdk/core';
import * as user_service from '../lib/user_service';

export class BackEndResumeAppStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new user_service.UserService(this, 'User');
  }
}
