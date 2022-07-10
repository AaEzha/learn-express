const express = require('express')
var ffmpeg = require('ffmpeg');

const app = express()

app.get('/', (req, res) => {
  try {
    var process = new ffmpeg('./assets/videolong.m4v'); // Video raw location
    process.then(function (video) {
      var startTime = new Date().getTime()
      console.log("Begin Processing Video");
      // Callback mode
      video.fnAddWatermark('./assets/logo.png', './video_done/done.mp4', { // Watermark location || video done Location
        position : 'NW'
      }, function (error, file) {
        var finishTime = new Date().getTime() 
        
        if (error) return console.log("Error: ", error); // if error
        console.log('New video file: ' + file, " At: ", Math.floor((finishTime - startTime) / 1000), "Second" ); // if Not error
        return res.send("Video Encoded Successfully :D")
      });
    }, function (err) {
      console.log('Error: ' + err);
    });
  } catch (e) {
    console.log(e.code);
    console.log(e.msg);
  }
})

app.listen(4000, (e) => {
  console.log("Server Start on port http://localhost:4000");
})