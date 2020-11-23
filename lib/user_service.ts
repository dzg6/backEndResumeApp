import * as core from "@aws-cdk/core";
import * as apigateway from "@aws-cdk/aws-apigateway";
import * as lambda from "@aws-cdk/aws-lambda";
import * as s3 from "@aws-cdk/aws-s3";a


export class UserService extends core.Construct {
  constructor(scope: core.Construct, id: string) {
    super(scope, id);

    const bucket = new s3.Bucket(this, "UserStore");

    //Lambda Handles
    const createUserHandle = new lambda.Function(this, "createUserHandle", {
      runtime: lambda.Runtime.NODEJS_10_X, 
      code: lambda.Code.fromAsset("resources/createUser"),
      handler: "createUser.main",
      environment: {
        BUCKET: bucket.bucketName
      }
    });
    bucket.grantReadWrite(createUserHandle); 

    const loginUserHandle = new lambda.Function(this, "loginUserHandle", {
      runtime: lambda.Runtime.NODEJS_10_X, 
      code: lambda.Code.fromAsset("resources/loginUser"),
      handler: "loginUser.main",
      environment: {
        BUCKET: bucket.bucketName
      }
    });
    bucket.grantReadWrite(loginUserHandle);


    //AUTHORIZER -- WIP
    const authFn = new lambda.Function(this, 'Authorizer', {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: lambda.Code.fromAsset("resources/authorizer"),
      handler: "authorizer.main",
    });
    
    const auth = new apigateway.RequestAuthorizer(this, 'userAuthorizer2', {
      handler: authFn,
      identitySources: [apigateway.IdentitySource.header('headerAuth2'), apigateway.IdentitySource.queryString("queryString2"), apigateway.IdentitySource.stageVariable('stageVar2')]
    });


    // API and API resources
    const api = new apigateway.RestApi(this, "users-api", {
      restApiName: "user Service",
      description: "This service serves users."
    });
    const user = api.root.addResource("{id}");
    const login = user.addResource("login");

    //Lambda Intergration
    const postCreateUser = new apigateway.LambdaIntegration(createUserHandle);
    const postLoginUser = new apigateway.LambdaIntegration(loginUserHandle);
    const getUsersIntegration = new apigateway.LambdaIntegration(createUserHandle, {
      requestTemplates: { "application/json": '{ "statusCode": "200" }' }
    });

    //Methods
    api.root.addMethod("GET", getUsersIntegration, {
      //authorizer: auth // this auth is a WIP
    }); // GET /
    user.addMethod("POST", postCreateUser); // POST /{id}
    login.addMethod("POST", postLoginUser); // POST /{id} / login

  }
}