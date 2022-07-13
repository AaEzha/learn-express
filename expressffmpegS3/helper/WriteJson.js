const jsonfile = require('jsonfile')

async function writeJSON(fileName, encodeData, addEncodeData = null){

  if (addEncodeData) {
    // Add new data
    encodeData.data.push({
      "order_id":addEncodeData.order_id,
      "raw_video":addEncodeData.video_url,
      "watermark_video":addEncodeData.watermark_video,
      "preview_video":addEncodeData.preview_video,
      "is_landscape":addEncodeData.is_landscape
    })
  }

  return jsonfile.writeFile(`./${fileName}.json`, encodeData, (err) => {
    if (err) {
      log('error_log', `Error when write to JSON FILE, message: ${err}`)
      console.log(err);
    }
  })
}

module.exports = writeJSON