const express = require('express')
const jsonfile = require('jsonfile')
const ffmpeg = require('ffmpeg')
const log = require('writelog')

var fs = require('fs')
var Upload = require("@aws-sdk/lib-storage").Upload;
var S3Client = require("@aws-sdk/client-s3").S3Client;
require('dotenv/config')

const app = express()
var isEncoding = false

async function readJSON(){
  return await jsonfile.readFile("./data.json")
}

async function writeJSON(encodeData){
  return jsonfile.writeFile('./data.json', encodeData, (err) => {
    if (err) {
      log('error_log', `Error when write to JSON FILE, message: ${err}`)
      console.log(err);
    }
  })
}

async function readFinishedJobJSON(){
  return await jsonfile.readFile("./finished_job.json")
}

async function writeFinishedJobJSON(oldEncodeData, newEncodeData){
  // Add new data
  oldEncodeData.data.push({
    "order_id":newEncodeData.order_id,
    "raw_video":newEncodeData.video_url,
    "watermark_video":newEncodeData.watermark_video,
    "preview_video":newEncodeData.preview_video,
    "is_landscape":newEncodeData.is_landscape
  })

  return jsonfile.writeFile('./finished_job.json', oldEncodeData, (err) => {
    if (err) {
      log('error_log', `Error when write to JSON FILE, message: ${err}`)
      console.log(err);
    }
  })
}


async function addWatermarkVideo(data){
  return new Promise((resolve, reject) => {
    var process = new ffmpeg(data.video_url)
    .then(async function (video) {
      const fileName = `video_w_${new Date().getTime()}-${data.order_id}.mp4`
      log('log', `Video with order id: ${data.order_id} is starting watermark proccess`);

      // Add Watermark
      video.fnAddWatermark('./assets/logo.png', `./video_done/${fileName}`, { // Watermark location || video done Location
        position : 'NW',
        margin_nord: 25,
        margin_west: 25
      }, async function (error, file) {
  
          // If there is an error
          if (error) {
            console.log(error);
            log('error_log', `Video with order id: ${data.order_id} is failed watermark proccess | error: ${error}`)
            return false
          } 

          log('log', `Video with order id: ${data.order_id} is finish watermark proccess`);

          // Upload To S3
          await uploadToS3(fileName, file, data.order_id)

          resolve(file)
        }
      )
    })
    .catch(err => {
      console.log(err);
      log('error_log', `Video with order id: ${data.order_id} is failed watermark proccess | error: ${err}`)
    });
  })
}

async function addPreviewWatermarkVideo(data){
  return new Promise((resolve, reject) => {
    var process = new ffmpeg(data.video_url)
    .then(async function (video) {
      const fileName = `video_p_${new Date().getTime()}-${data.order_id}.mp4`
      log('log', `Video with order id: ${data.order_id} is starting preview watermark proccess`);

      // Add preview watermark
      video.fnAddWatermark('./assets/preview.png', `./video_done/${fileName}`, { // preview watermark location || video done Location
        position : 'C',
      }, async function (error, file) {
  
          // If there is an error
          if (error) {
            console.log(error);
            log('error_log', `Video with order id: ${data.order_id} is failed preview watermark proccess | error: ${error}`)
            return false
          } 
    
          log('log', `Video with order id: ${data.order_id} is finish preview watermark proccess`);

          // Upload To S3
          await uploadToS3(fileName, file, data.order_id)

          resolve(file)
        }
      )
    })
    .catch(err => {
      log('error_log', `Video with order id: ${data.order_id} is failed preview watermark proccess | error: ${err}`)
      reject(err)
    });
  })
}

async function uploadToS3(fileName, fileLocation, order_id){
  const s3Client = new S3Client({
    endpoint: `https://s3.${process.env.S3_REGION}.wasabisys.com`,
    credentials:{
      accessKeyId: process.env.S3_ACCESS_ID_KEY,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
    },
    region: process.env.S3_REGION,
  }); 

  const file = fs.readFileSync(fileLocation,  (err, data) => {
    if (err) {
      log('error_log', `Failed to read video data with order_number: ${order_id}! | error: ${err}`);
      return false
    }

    return data
  })

  try {
    const parallelUploads3 = new Upload({
      client: s3Client,
      params: { 
        Bucket: process.env.S3_BUCKET_NAME, 
        Key: fileName,
        Body: file,
      },

      // tags: [
      //   /*...*/
      // ], // optional tags
      queueSize: 4, // optional concurrency configuration
      partSize: 1024 * 1024 * 5, // optional size of each part, in bytes, at least 5MB
      leavePartsOnError: false, // optional manually handle dropped parts
    });
    log('log', `Uploading Video with order_number: ${order_id}`);
    parallelUploads3.on("httpUploadProgress", (progress) => {
      // console.log(progress);
    });
  
    await parallelUploads3.done();
    log('log', `Video with order_number: ${order_id} successfully uploaded!`);

  } catch (err) {
    log('error_log', `Failed to upload video with order_number: ${order_id} | error: ${err}`);
    
    console.log(err);
  }

  
}

app.get('/', async (req, res) => {
  if (!isEncoding) {
    proccessVideo()
  }

  res.send("Encode start!")
})

app.get('/add2', async (req, res) => {

    let encodeData = await readJSON() 
    .catch(err => {
      log('error_log', `Error when read JSON FILE, message: ${err}`)
      console.log(err)
    })

    // Add new data
    encodeData.data.push({
      "order_id": encodeData.data.length > 0 ? encodeData.data[encodeData.data.length - 1].order_id + 1 : 1,
      // "order_id": order_id, // Real data
      "video_url": "./assets/video.mp4",
      "is_landscape": true
    })

  await writeJSON(encodeData)

  if (!isEncoding) {
    proccessVideo()
  }

  res.send("Encode data added Successfully!")
})

app.get('/add', async (req, res) => {

  let encodeData = await readJSON() 
  .catch(err => {
    log('error_log', `Error when read JSON FILE, message: ${err}`)
    console.log(err)
  })

  // Add new data
  encodeData.data.push({
    "order_id": encodeData.data.length > 0 ? encodeData.data[encodeData.data.length - 1].order_id + 1 : 1,
    // "order_id": order_id, // Real data
    "video_url": "./assets/talentvideo1.mp4",
    "is_landscape": true
  })

await writeJSON(encodeData)

if (!isEncoding) {
  proccessVideo()
}

res.send("Encode data added Successfully!")
})

async function proccessVideo(){
  isEncoding = true
  let encodeData = await readJSON()
  .catch(err => {
    log('error_log', `Error when read JSON FILE, message: ${err}`)
    console.log(err)
  })

  if (encodeData.data.length > 0) {
    let currentEncode = encodeData.data[0]
    let encodedVideoData = {
      "order_id":currentEncode.order_id,
      "raw_video":currentEncode.video_url,
      "watermark_video":'',
      "preview_video":'',
      "is_landscape":currentEncode.is_landscape
    }
  
    try {
  
      // Add watermark Foryou to Video
      await addWatermarkVideo(currentEncode)
        .then(res => {
          encodedVideoData.watermark_video = res
        })
        .catch(err => {
          console.log(err)
          log('error_log', `Video with order id: ${data.order_id} is failed watermark proccess | error: ${err}`)
        })
  
      // Add watermark Preview to Video
      await addPreviewWatermarkVideo(currentEncode)
        .then(res => {
          encodedVideoData.preview_video = res
        })
        .catch(err => {
          console.log(err)
          log('error_log', `Video with order id: ${data.order_id} is failed preview watermark proccess | error: ${err}`)
        })
  
      console.log("result:", encodedVideoData);
      
      // Refresh Data (if there's new data)
      encodeData = await readJSON()
      .catch(err => {
        log('error_log', `Error when read new JSON FILE, message: ${err}`)
        log('error_log', `All encode proccess stopped!`)
        return false
      })

      // Remove Current Encode data
      encodeData.data = encodeData.data.filter(value => {
        return value.order_id != currentEncode.order_id
      })
  
      await writeJSON(encodeData)
      
      // Add finished data to log
      let doneEncodeData = await readFinishedJobJSON() 
      await writeFinishedJobJSON(doneEncodeData, encodedVideoData)
  
      if (encodeData.data.length > 0) {
        proccessVideo()
      } else {
        isEncoding = false
      }
  
    } catch (err) {
      log('error_log', `Failed to proccess... Error: ${err}`);
      // console.log(e.code);
      // console.log(e.msg);
    }

  } else {
    log('log', `All video encoded successfully`);
  }
}

app.listen(4000, (e) => {
  console.log("Server Start on port http://localhost:4000");
})
