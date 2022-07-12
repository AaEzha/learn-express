var express = require('express')
var fs = require('fs')
var Upload = require("@aws-sdk/lib-storage").Upload;
var S3Client = require("@aws-sdk/client-s3").S3Client;
require('dotenv/config')

// Create an Amazon S3 service client object.
const s3Client = new S3Client({
  endpoint: `https://s3.${process.env.S3_REGION}.wasabisys.com`,
  credentials:{
    accessKeyId: process.env.S3_ACCESS_ID_KEY,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
  },
  region: process.env.S3_REGION,
});

var app = express()

const uploadFile = async () => {

  const file = fs.readFileSync('./public/video.mp4', (err, data) => {
    if (err) {
      console.log("Error", err);    
      return false
    }
    return data
  })

  try {
    const parallelUploads3 = new Upload({
      client: s3Client,
      params: { 
        Bucket: process.env.S3_BUCKET_NAME, 
        Key: "video1.mp4",
        Body: file,
      },

      // tags: [
      //   /*...*/
      // ], // optional tags
      queueSize: 4, // optional concurrency configuration
      partSize: 1024 * 1024 * 5, // optional size of each part, in bytes, at least 5MB
      leavePartsOnError: false, // optional manually handle dropped parts
    });
  
    parallelUploads3.on("httpUploadProgress", (progress) => {
      console.log(progress);
    });
  
    await parallelUploads3.done();
    console.log("File Uploaded");
  } catch (e) {
    console.log(e);
  }

}


app.get('/', async (req, res) => {
  await uploadFile()
  return res.status(200).send("File Uploaded")
});

app.listen(5000, (err) => {
  if (err) console.log("Error: "+err)

  console.log("Server start on http://localhost:5000");

})