const express = require('express')

const controller = require('./controller')
const upload = require('./middleware')

const app = express()

app.post('/', upload.single('image'), controller.user)

app.listen(5000, (err) => {
  if (err) console.log("Error: "+err)

  console.log("Server start on http://localhost:5000");

})