const route = require('express').Router()
const DBService = require('../model/index')
// const route = express.

route.route("/") 
    .get((req, res) => {
        const db =  DBService.getDBServiceInstance()
        
        const data =  db.getAllData()
        res.json({data: data, daada: 'lasdsa'})
    }) 

    .post((req, res) => {
        res.send('Create New data')
    }) 

    .patch((req, res) => {
        res.send('Update data')
    }) 

    .delete((req, res) => {
        res.send('Delete data')
    }) 



module.exports = route