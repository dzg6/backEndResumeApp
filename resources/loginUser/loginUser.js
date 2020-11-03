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
    var path = event.path.startsWith('/') ? event.path.substring(1) : event.path;
    var userPath = event.pathParameters.id.toLowerCase();
    userPath = userPath.toLowerCase();
    var username = eventBody.username;
    username = username.toLowerCase();

    // return {
    //   statusCode: 200,
    //   headers: {},
    //   body: JSON.stringify(userPath)
    // };

    if (method === "POST") {
      // POST /name
      // Return error if we do not have a name
      if (!username) {
        return {
          statusCode: 400,
          headers: {},
          body: "Widget name missing"
        };
      }


      const checkUser = await S3.listObjectsV2({ Bucket: bucketName, Prefix: userPath}).promise();
       if(checkUser.Contents && checkUser.Contents.length <= 0){

        const response = {
          status:{
            code: 200,
            msg: "No Username matches " + userPath,
          }
        };
      // if(checkUser.Contents[0].Key === username){
        return{
          statusCode: 200,
          headers: {},
          body: JSON.stringify(response)
        }
       }


      const data = await S3.getObject({ Bucket: bucketName, Key: userPath}).promise().then();
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
        msg: "successful login of " + userPath,
      },
      username: userData.username.toLowerCase(),
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

    };//POST
      // if(checkUser.Contents && checkUser.Contents.length > 0){

      // }


    //   const params = {
    //     KeyId: masterKey,
    //     Plaintext: eventBody.password
    //   };
    //   const encryptPassword = await kms.encrypt(params).promise();
    //   const cleanPassword = Buffer.from(encryptPassword.CiphertextBlob).toString('base64')
    //   const now = new Date();
    //   const outputUser = {
    //     username: username,
    //     password: cleanPassword,
    //     dateCreated: now,
    //   };

    //   await S3.putObject({
    //     Bucket: bucketName,
    //     Key: username,
    //     Body: JSON.stringify(outputUser),
    //     ContentType: 'application/json'
    //   }).promise();

    //   var acceptedMSG = username + " has been created!" 

    //   return {
    //     statusCode: 200,
    //     headers: {},
    //     body: acceptedMSG
    //   };
    // }


    // // We got something besides GET, 
    // return {
    //   statusCode: 400,
    //   headers: {},
    //   body: "We only accept GET not" + method
    // };
  } catch(error) {
    var body = error.stack || JSON.stringify(error, null, 2);
    return {
      statusCode: 400,
      headers: {},
      body: body
    }
  }
}