const express = require('express')
const ffmpeg = require('ffmpeg')
const log = require('writelog')

var fs = require('fs')
var {Upload} = require("@aws-sdk/lib-storage");
var {S3Client} = require("@aws-sdk/client-s3");
require('dotenv/config')

var readJSON = require('./helper/ReadJson')
var writeJSON = require('./helper/WriteJson')
const { get } = require('https')

const app = express()
var isEncoding = false

async function addWatermarkVideo(data){
  return new Promise((resolve, reject) => {
    var process = new ffmpeg(`./raw_video/${data.raw_video_name}.${data.raw_video_extension}`)
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
          .catch(err => {
            reject(err)
          })

          fs.unlink(file, (err) => {
            if (err) {
              log('error_log', `preview video with order id: ${data.order_id} is failed to removed | error: ${error}`)
              return false
            }
          })

          resolve(file)
        }
      )
    })
    .catch(err => {
      log('error_log', `Video with order id: ${data.order_id} is failed watermark proccess | error: ${err}`)
      reject(err)
    });
  })
}

async function addPreviewWatermarkVideo(data){
  return new Promise((resolve, reject) => {
    var process = new ffmpeg(`./raw_video/${data.raw_video_name}.${data.raw_video_extension}`)
    .then(async function (video) {
      const fileName = `video_p_${new Date().getTime()}-${data.order_id}.mp4`
      log('log', `Video with order id: ${data.order_id} is starting preview watermark proccess`);

      // Add preview watermark
      video.fnAddWatermark('./assets/preview.png', `./video_done/${fileName}`, { // preview watermark location || video done Location
        position : 'C',
      }, async function (error, file) {
  
          // If there is an error
          if (error) {
            log('error_log', `Video with order id: ${data.order_id} is failed preview watermark proccess | error: ${error}`)
            return false
          } 
    
          log('log', `Video with order id: ${data.order_id} is finish preview watermark proccess`);

          // Upload To S3
          await uploadToS3(fileName, file, data.order_id)
          .catch(err => {
            reject(err)
          })

          fs.unlink(file, (err) => {
            if (err) {
              log('error_log', `watermarked video with order id: ${data.order_id} is failed to removed | error: ${error}`)
              return false
            }
          })

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
    throw err
  }
}

async function downloadFromS3(data){
  return new Promise((resolve, reject) => {

    const fileExtension = data.video_url.split('.')
    
    const file = fs.createWriteStream(`./raw_video/${data.order_id}.${fileExtension[fileExtension.length - 1]}`);
    let fileInfo = null;

    log('log', `Downloading RAW video from url: ${data.video_url}`)

    const request = get(data.video_url , response => {
      if (response.statusCode !== 200) {
        fs.unlink(`./raw_video/${data.order_id}.${fileExtension[fileExtension.length - 1]}`);
        reject(err);
        return;
      }

      fileInfo = {
        fileName: data.order_id,
        extension: fileExtension[fileExtension.length - 1],
        mime: response.headers['content-type'],
      };

      response.pipe(file);
    });

    // The destination stream is ended by the time it's called
    file.on('finish', () => {
      resolve(fileInfo)
      log('log', `Success download RAW video from url: ${data.video_url}`)
    });

    request.setTimeout(1000 * 60 * 30, (err) => {
      fs.unlink(`./raw_video/${data.order_id}.${fileExtension[fileExtension.length - 1]}`, () => reject(err));
      request.destroy();
      log('error_log', `Timeout to download RAW video from url: ${data.video_url}`)
    })

    request.on('error', err => {
      fs.unlink(`./raw_video/${data.order_id}.${fileExtension[fileExtension.length - 1]}`, () => reject(err));
      request.destroy();
      log('error_log', `Failed to download RAW video from url: ${data.video_url}`)
    });

    file.on('error', err => {
      fs.unlink(`./raw_video/${data.order_id}.${fileExtension[fileExtension.length - 1]}`, () => reject(err));
      request.destroy();
      log('error_log', `Failed to download RAW video from url: ${data.video_url}`)
    });

    request.end();

  })
}

app.get('/', async (req, res) => {
  let encodeData = await readJSON('data') 
  .catch(err => {
    log('error_log', `Error when read JSON FILE, message: ${err}`)
    console.log(err)
  })

  res.status(200).json(encodeData)
})

app.get('/run', async (req, res) => {
  
  if (!isEncoding) {
    proccessVideo()
  }

  res.status(200).send("Running Jobs")
})

app.get('/add2', async (req, res) => {

    let encodeData = await readJSON('data') 
    .catch(err => {
      log('error_log', `Error when read JSON FILE, message: ${err}`)
      console.log(err)
    })

    // Add new real data
    // encodeData.data.push(req.body)

    // Add new data | Comment this in prod
    encodeData.data.push({
      "order_id": encodeData.data.length > 0 ? encodeData.data[encodeData.data.length - 1].order_id + 1 : 1,
      // "order_id": order_id, // Real data
      // "video_url": "./assets/video.mp4",
      // "video_url": "https://s3.ap-southeast-2.wasabisys.com/testing-area/asset/talentvideo2.mp4",
      "video_url": "https://s3.ap-southeast-2.wasabisys.com/testing-area/asset/video2.mkv",
      "is_landscape": true
    })

  await writeJSON('data',encodeData)

  if (!isEncoding) {
    proccessVideo()
  }

  res.send("Encode data added Successfully!")
})

app.get('/add', async (req, res) => {

  let encodeData = await readJSON('data') 
  .catch(err => {
    log('error_log', `Error when read JSON FILE, message: ${err}`)
    console.log(err)
  })

  // Add new real data
  encodeData.data.push(req.body)

await writeJSON('data', encodeData)

if (!isEncoding) {
  proccessVideo()
}

res.send("Encode data added Successfully!")
})

async function proccessVideo(){
  isEncoding = true
  let encodeData = await readJSON('data')
  .catch(err => {
    log('error_log', `Error when read JSON FILE, message: ${err}`)
    console.log(err)
  })

  if (encodeData.data.length > 0) {
    let currentEncode = {
      ...encodeData.data[0],
      "raw_video_name":'',
      "raw_video_extension":'',
      "watermark_video":'',
      "preview_video":'',
    }

    try {

      // Download File From S3
      await downloadFromS3(currentEncode)
        .then(res => {
          currentEncode.raw_video_name = res.fileName
          currentEncode.raw_video_extension = res.extension
        })
        .catch(err => {
          // console.log(err)
          log('error_log', `Error when download RAW video with order id: ${data.order_id} | error: ${err}`)
        })
      
      // Add watermark Foryou to Video
      await addWatermarkVideo(currentEncode)
        .then(res => {
          currentEncode.watermark_video = res
        })
        .catch(err => {
          console.log(err)
          log('error_log', `Video with order id: ${data.order_id} is failed watermark proccess | error: ${err}`)
        })
  
      // Add watermark Preview to Video
      await addPreviewWatermarkVideo(currentEncode)
        .then(res => {
          currentEncode.preview_video = res
        })
        .catch(err => {
          console.log(err)
          log('error_log', `Video with order id: ${data.order_id} is failed preview watermark proccess | error: ${err}`)
        })
  
      // Refresh Data (if there's new data)
      encodeData = await readJSON('data')
      .catch(err => {
        log('error_log', `Error when read new JSON FILE, message: ${err}`)
      })

      // Remove Current Encode data
      encodeData.data = encodeData.data.filter(value => {
        return value.order_id != currentEncode.order_id
      })
      await writeJSON('data', encodeData)
      
      // Add finished data to log
      let doneEncodeData = await readJSON('finished_job') 
      await writeJSON('finished_job', doneEncodeData, currentEncode)

      // Delete Old raw video
      fs.unlink(`./raw_video/${currentEncode.raw_video_name}.${currentEncode.raw_video_extension}`, (err) => {
        if (err) {
          log('error_log', `Raw video with order id: ${data.order_id} is failed to removed | error: ${error}`)
          return false
        }
      })
      
      // Switch to Next Job
      proccessVideo()
      
    } catch (err) {
      log('error_log', `Failed to proccess... Error: ${err}`);

      // Refresh Data (if there's new data)
      encodeData = await readJSON('data')
      .catch(err => {
        log('error_log', `Error when read new JSON FILE, message: ${err}`)
      })

      // Remove Current Encode data
      encodeData.data = encodeData.data.filter(value => {
        return value.order_id != currentEncode.order_id
      })
      await writeJSON('data', encodeData)

      // Add error data to failed_job.json
      const errorJobs = await readJSON("failed_job")
      await writeJSON('failed_job', errorJobs, currentEncode)

      // Switch to Next Job
      proccessVideo()
    }

  } else {
    log('log', `All jobs done!`);
    isEncoding = false
  }
}

app.listen(4000, (e) => {
  console.log("Server Start on port http://localhost:4000");
})
