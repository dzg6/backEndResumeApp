const AWS = require('aws-sdk');
const { error } = require('console');
const S3 = new AWS.S3();
const kms = new AWS.KMS();
const bucketName = process.env.BUCKET;
const masterKey =  process.env.KMSKEY;

exports.main = async function(event, context) {
  try {

    
    var method = event.httpMethod;
    var eventBody = JSON.parse(event.body);

    var userPath = event.pathParameters.id.toLowerCase();
    userPath = userPath.toLowerCase();

    var username = eventBody.username;
    username = username.toLowerCase();

    if (method === "POST") {

      // Return error if we do not have a name
      if (!username) {
        return {
          statusCode: 400,
          headers: {},
          body: "Widget name missing"
        };
      }


      const getUser = await S3.listObjectsV2({ Bucket: bucketName, Prefix: username}).promise();

      //Return if Username does not exisit in Database
       if(getUser.Contents && getUser.Contents.length <= 0){

        const response = {
          status:{
            code: 200,
            msg: "No Username matches " + username,
          }
        };
        return{
          statusCode: 200,
          headers: {},
          body: JSON.stringify(response)
        }

       }


      const data = await S3.getObject({ Bucket: bucketName, Key: username}).promise().then();
      const bufferedData = Buffer.from(data.Body).toString();
      const userData = JSON.parse(bufferedData);

      const paramsDecrypt2 = {
        CiphertextBlob: Buffer.from(userData.password, 'base64')
      };
        
      const decrypt2Result = await kms.decrypt(paramsDecrypt2).promise();
      const cleanedPassword = Buffer.from(decrypt2Result.Plaintext).toString();

    const response = {
      status:{
        code: 200,
        msg: "successful login of " + username,
      },
      username: userData.username.toLowerCase(),
      email: userData.email,
      isAuthenicated: true,
    };

      if(cleanedPassword == eventBody.password){

        return{
          statusCode: 200,
          headers: {},
          body: JSON.stringify(response)
        }
      }else{
        
        return{
          statusCode: 200,
          headers: {},
          body: JSON.stringify({message:"password DID NOT MATCH"})
        }
      }

    };

  } catch(error) {
    var body = error.stack || JSON.stringify(error, null, 2);
    return {
      statusCode: 400,
      headers: {},
      body: body
    }
  }
}