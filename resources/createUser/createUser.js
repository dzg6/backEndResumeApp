/**
 *
 * Create User Lambda Handler Function
 *
 */
const AWS = require('aws-sdk');
const { error } = require('console');
const S3 = new AWS.S3();
const kms = new AWS.KMS();
const bucketName = process.env.BUCKET;
const masterKey = process.env.KMSKEY;


exports.main = async function(event, context) {
  try {

    //parsing event body from client app
    var method = event.httpMethod;
    var eventBody = JSON.parse(event.body);

    var username = event.path.startsWith('/') ? event.path.substring(1) : event.path;
    username = username.toLowerCase();
    var password = eventBody.password;
    var email = eventBody.email.toLowerCase();


    if (method === "GET") {

      // GET / to get the names of all widgets
      if (event.path === "/") {
        const data = await S3.listObjectsV2({ Bucket: bucketName }).promise();
        var body = {
          users: data.Contents.map(function(e) { return e.Key })
        };
        return {
          statusCode: 200,
          headers: {},
          body: JSON.stringify(body)
        };
      }
    }



    if (method === "POST") {

      // POST /name
      // Return error if we do not have a username
      if (!username) {
        return {
          statusCode: 400,
          headers: {},
          body: "Widget name missing"
        };
      }
      
      //Checks if the Username already exisist 
      const checkUser = await S3.listObjectsV2({ Bucket: bucketName, Prefix: username}).promise();

      if(checkUser.Contents && checkUser.Contents.length > 0){
        if(checkUser.Contents[0].Key === username){

          const response = {
            status:{
              code: 400,
              msg: "Username already exisit! " + username,
            }
          };

          return{
            statusCode: 200,
            headers: {},
            body: JSON.stringify(response)
          }
        }
    }

    // Encrypts Password
      const params = {
        KeyId: masterKey,
        Plaintext: password,
      };
      const encryption = await kms.encrypt(params).promise();
      const encryptedPassword = Buffer.from(encryption.CiphertextBlob).toString('base64')

      //Create User
      const now = new Date();
      const createUser = {
        username: username,
        password: encryptedPassword,
        email: email,
        dateCreated: now,
      };

      await S3.putObject({
        Bucket: bucketName,
        Key: username,
        Body: JSON.stringify(createUser),
        ContentType: 'application/json'
      }).promise();

      //Create successful Response that user was created
      const response = {
        status:{
          code: 200,
          msg: "successful account created for " + username,
        }
      };
      return {
        statusCode: 200,
        headers: {},
        body: JSON.stringify(response)
      };
    }


    // We got something besides POST, 
    return {
      statusCode: 400,
      headers: {},
      body: "We only accept POST not" + method
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