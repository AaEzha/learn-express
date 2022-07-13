const jsonfile = require('jsonfile')

async function readJSON(fileName){
  return await jsonfile.readFile(`./${fileName}.json`)
}

module.exports = readJSON

