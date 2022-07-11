const express = require('express')
const axios = require('axios')
const PDFDocument = require('pdfkit');
const fs = require('fs')

const controller = require('./controller')
const upload = require('./middleware')

const app = express()

app.get('/', (req, res) => {
  const pdf = new PDFDocument
  pdf.pipe(fs.createWriteStream('./upload/upload.pdf'))
  pdf.text("My Sample PDF Document");
  pdf.end()

  return res.send("berhasil")
})

app.post('/', upload.single('image'), controller.user)

app.listen(5000, (err) => {
  if (err) console.log("Error: "+err)

  console.log("Server start on http://localhost:5000");

})