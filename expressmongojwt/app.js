const express = require("express");
const morgan = require("morgan");
const mongoose = require('mongoose')
const routes = require('./routes/index')
const app = express();
require ('dotenv/config')

// Connect to DB
mongoose.connect(process.env.DB_CONNECT, () => {
  console.log("Connected to DB!");
})

// Dependency & Middleware
app.use(morgan("tiny"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Specifiy middleware in /posts path only
app.use("/posts", (req, res, next) => {
  console.log("ini middleware");
  next();
});

// Routers
app.use(routes)

// Port & Start App
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Listening On Port " + port);
});
// End Port & Start App
