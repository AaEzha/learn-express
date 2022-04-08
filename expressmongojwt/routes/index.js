const express = require("express")
const bcrypt = require("bcryptjs");
const userModel = require('../model/User')
const jwt = require('jsonwebtoken');
const route = express.Router()
const jwtMiddleware = require('../middleware/JWTVerify')

// Validation
// const joi = require('@hapi/joi')

// const validationRules = {
//   name: joi.string().min(4).required(),
//   email: joi.string().min(5).email().required(),
//   password: joi.string().min(5).required()
// }

// Routers
route.get("/", (req, res) => {
  res.status(500).send("Berhasil");
});

route.get("/posts", (req, res) => {
  res.status(500).send(req.params);
});

// Pakai fungsi asyc await supaya prosesnya non blocking
route.post("/register", async (req, res) => {
  // Validating Request
  // const validation = joi.validate(req.body, validationRules)

  // Config bcrypt
  const salt = await bcrypt.genSalt(10)
  // Hash Password
  const hashPassword = await bcrypt.hash(req.body.password, salt)

  // Pasangkan value request dengan database
  const user = new userModel({
    name: req.body.name,
    email: req.body.email,
    password: hashPassword,
  })

  try {
    // save itu fungsi dari mongoose
    const savedUser = await user.save()
    res.json({User: savedUser.id})
  } catch (err) {
    res.status(400).send(err)
  }
});

route.post('/login', async (req, res) => {

  // Check email
  // const user = await userModel.findOne({email: req.body.email})
  // if(!user) return res.status(400).send("Invalid email")

  // // Check password
  // const validPassword = await bcrypt.compare(req.body.password, user.password)
  // if(!validPassword) return res.status(400).send("Invalid Password")

  // If Success
//   token = jwt.sign(
//     {_id: user.id, hola: "Hola dunia!"}, 
//     process.env.TOKEN_SECRET)
//   res.header('auth-token', token)
//     .status(200)
//     .send(token)
// })
  token = jwt.sign(
    {_id: 324, hola: "Hola dunia!"}, 
    process.env.TOKEN_SECRET)
  res.header('auth-token', token)
    .status(200)
    .send(token)
})

// Using our custom jwtMiddleware
route.get("/auth", jwtMiddleware, (req, res) => {
  
  res.status(200).send("berhasil");
});

module.exports = route
