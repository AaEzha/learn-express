const jwt = require("jsonwebtoken");

// Auth middleware for verifying JWT
module.exports = function(req, res, next){
  console.log(req.header("auth-token"));
  // If no token
  const token = req.header("auth-token");
  if (!token) return res.status(401).send("Access Denied");

  try {
    // verify token
    const verify = jwt.verify(token, process.env.TOKEN_SECRET);
    req.user = verify;
    next()
    
  } catch (error) {
    return res.status(401).send("Token Invalid");
  }
}
