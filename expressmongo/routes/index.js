const express = require("express");
const route = express.Router();

route.get("/", (req, res) => {
  res.status(500).send("Berhasil");
});
route.get("/posts", (req, res) => {
  res.status(500).send(req.params);
});

module.exports = route
