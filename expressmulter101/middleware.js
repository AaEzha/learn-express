const multer = require('multer')

  var storage = multer.diskStorage({
    destination: function(req, file, callback){
      console.log(file);
      callback(null, './upload')
    },
    filename: function(req, file, callback){
      callback(null, "namaFile")
    }
  })

  const upload = multer({
    storage: storage
  })


module.exports = upload