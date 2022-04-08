const express = require("express");
const morgan = require("morgan");
const db = require("./db");
const user = require("./model/user");
const post = require("./model/user");
require("dotenv/config");

const app = express();

app.use(express.json())
app.use(morgan("tiny"))

// Migrating all model
db.sync()
  .then(result => {
    console.log(result);
  }).catch(err => {
    console.log(err);
  })

app.get("/", (req, res) => {
  // res.json("lalalal")
  user.findAll()

  .then(data => {
    res.send(data)
  })

  .catch(err => {
    console.log(err);
  })
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server start at http://localhost:${port}`);
});
