const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const routes = require('./routes/index')
require("dotenv/config")

const app = express()

// Middleware
app.use(cors())
app.use(morgan('tiny'))
app.use(express.json())
app.use(express.urlencoded({extended:false}))

// Routes
app.use(routes)

// Run Server
const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log("Server is Running on http://localhost:"+port);
})