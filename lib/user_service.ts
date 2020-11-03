import * as core from "@aws-cdk/core";
import * as apigateway from "@aws-cdk/aws-apigateway";
import * as lambda from "@aws-cdk/aws-lambda";
import * as s3 from "@aws-cdk/aws-s3";



export class UserService extends core.Construct {
  constructor(scope: core.Construct, id: string) {
    super(scope, id);

    const bucket = new s3.Bucket(this, "UserStore");

    const createUserHandle = new lambda.Function(this, "createUserHandle", {
      runtime: lambda.Runtime.NODEJS_10_X, // So we can use async in user.js
      code: lambda.Code.fromAsset("resources/createUser"),
      handler: "createUser.main",
      environment: {
        BUCKET: bucket.bucketName
      }
    });

    bucket.grantReadWrite(createUserHandle); // was: createUserHandle.role);



    const loginUserHandle = new lambda.Function(this, "loginUserHandle", {
      runtime: lambda.Runtime.NODEJS_10_X, // So we can use async in user.js
      code: lambda.Code.fromAsset("resources/loginUser"),
      handler: "loginUser.main",
      environment: {
        BUCKET: bucket.bucketName
      }
    });
    bucket.grantReadWrite(loginUserHandle);



    const api = new apigateway.RestApi(this, "users-api", {
      restApiName: "user Service",
      description: "This service serves users."
    });
    const user = api.root.addResource("{id}");
    const login = user.addResource("login");
        // Add new user to bucket with: POST /{id}
    const postCreateUser = new apigateway.LambdaIntegration(createUserHandle);
    const loginUser = new apigateway.LambdaIntegration(loginUserHandle);
    //     // Get a specific user from bucket with: GET /{id}
     //const getuserIntegration = new apigateway.LambdaIntegration(createUserHandle);
    
    //     // Remove a specific user from the bucket with: DELETE /{id}
    // const deleteuserIntegration = new apigateway.LambdaIntegration(createUserHandle);

    const getusersIntegration = new apigateway.LambdaIntegration(createUserHandle, {
      requestTemplates: { "application/json": '{ "statusCode": "200" }' }
    });

     api.root.addMethod("GET", getusersIntegration); // GET /
     //api.root.addMethod('POST', postCreateUser);
    user.addMethod("POST", postCreateUser); // POST /{id}
    login.addMethod("POST", loginUser); // POST /{id} / login
    // user.addMethod("GET", getuserIntegration); // GET /{id}
    // user.addMethod("DELETE", deleteuserIntegration); // DELETE /{id}
  }
}