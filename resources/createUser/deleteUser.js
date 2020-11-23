/**
 *
 * Delete User Lambda Handler Function
 * THIS IS A WIP
 */
const AWS = require('aws-sdk');
const { error } = require('console');
const S3 = new AWS.S3();
const kms = new AWS.KMS();
const bucketName = process.env.BUCKET;
const masterKey = process.env.KMSKEY;

exports.main = async function(event, context) {
  try {
    var method = event.httpMethod;
    // Get name, if present
    var username = event.path.startsWith('/') ? event.path.substring(1) : event.path;

    if (method === "DELETE") {
      // DELETE /name
      // Return an error if we do not have a name
      if (!username) {
        return {
          statusCode: 400,
          headers: {},
          body: "username missing"
        };
      }

      await S3.deleteObject({
        Bucket: bucketName, Key: username
      }).promise();

      return {
        statusCode: 200,
        headers: {},
        body: "Successfully deleted user " + username
      };
    }

    // We got something besides a GET, POST, or DELETE
    return {
      statusCode: 400,
      headers: {},
      body: "We only accept GET, POST, and DELETE, not " + method
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