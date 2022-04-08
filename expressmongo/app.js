const express = require("express");
const morgan = require("morgan");
const routes = require('./routes/index')
const app = express();
require ('dotenv/config')

// Dependency & Middleware
app.use(morgan("tiny"));

// Specifiy middleware in /posts path only
app.use("/posts", (req, res, next) => {
  console.log("ini middleware");
  next();
});
// End Dependency & Middleware

// Routers
// app.use(express.json())
app.use(routes)
// End Routers

// Port & Start App
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Listening On Port " + port);
});
// End Port & Start App
