const e = require('express');
var express = require('express')
var fs = require('fs');
var path = require('path');
var readXlsxFile = require('read-excel-file/node');
var writelog = require("writelog");
var cron = require('node-cron')
var axios = require('axios')

require('dotenv/config')

const app = express()

app.get('/', (req, res) => {
  return res.send("berhasil")
})

cron.schedule(process.env.CRON_SCHEDULE, () => {

  // Read file
  fs.readdir(process.env.FOLDER_NAME, (err, files) => {
    
    if (!err) {

      // Loop through all Files to get today excel
      let getFile = files.filter(value => {
        // Find today excel
        return value == `${process.env.FILE_PREFIX}${'excel2'}.xlsx`
      })
      
      // console.log(getFile);
      
      if (getFile.length > 0) {

        // Loop through file
        getFile.forEach(file => {

          readXlsxFile(`./upload/${file}`)

          // If Can read excel file
          .then(rows => {
            let readExcel = []
            // console.log(rows);
    
            // function validation(head){
            //   if (JSON.stringify(head[0]).toLowerCase() != 'date') return false
            //   if (JSON.stringify(head[1]).toLowerCase() != 'transcoat') return false
            //   if (JSON.stringify(head[2]).toLowerCase() != 'deskripsi') return false
            //   if (JSON.stringify(head[3]).toLowerCase() != 'coa') return false
            //   if (JSON.stringify(head[4]).toLowerCase() != 'debit') return false
            //   if (JSON.stringify(head[5]).toLowerCase() != 'kredit') return false
            //   console.log(header);
            // }
    
            // if (validation(rows[0])) {
            rows.forEach(row => {
              readExcel.push({
                date: row[0],
                transcoat: row[1],
                deskripsi: row[2],
                coa: row[3],
                debit: row[4],
                kredit: row[5],
              })
            })
            // }
            
            // send To API Laravel
            // axios.post(process.env.BACKEND_ENDPOINT, {data: readExcel.slice(1)}, {
            //   headers: {
            //     Authorization: "Bearer " + process.env.JWT_TOKEN
            //  }
            // })
            // .then(res => {

              // console.log(res);
              writelog('log', readExcel.slice(1));

              // Move file
              fs.rename(`./upload/${file}`, `./archive/transaction-${Date.now()}${path.extname(file)}`, (err) => {
                if (err) {
                  writelog('log', 'Error: '+err)
                } else {
                  writelog('log', `File ${process.env.FILE_PREFIX}${'excel2'}.xlsx Berhasil Diupload`)
                }
              })

            // })
            // .catch(err => {
            //   writelog('log', {
            //     status: err.response.status, 
            //     message: err.response.data
            //   })
            // })
    
          })

          // If error
          .catch(err => {
            writelog('log', 'Error: '+err)
            console.log(err);
          })
          
        })
    
      // If File Excel not Found!
      } else {
        writelog('log', 'File Excel tidak ditemukan')
      }

    // If error
    } else {
      writelog('log', 'Error: '+err)
      console.log(err);
    }
  })

})

app.get('/upload', (req, res) => {

})

app.listen(4000, () => {
  console.log("Server Run on http://localhost:4000/")
})