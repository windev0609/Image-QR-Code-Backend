const jwt = require("jsonwebtoken");

const { NOTFOUND, SERVERERROR } = require("../constants/errorCode");
const { NOTFOUNDMSG, SERVERERRORMSG } = require("../constants/errorMessage");
const User = require("../models/UserModel");

require("dotenv").config();
authToken = (req, res, next) => {
  let token = req.headers["x-auth-token"];

  if (!token) {
    return res.status(403).send({
      message: "No token provided!",
    });
  }

  jwt.verify(token, process.env.token_key, (err, decoded) => {
    if (err) {
      return res.status(401).send({
        message: "Unauthorized!",
      });
    }

    User.findOne({ _id: decoded.id }).th;
    en((user) => {
      if (!user) return res.status(NOTFOUND).json({ errors: NOTFOUNDMSG });
      req.user = user;
      console.log("middleware success");
      return next();
    }).catch((err) => {
      return res.status(SERVERERROR).json({ message: SERVERERRORMSG });
    });
  });
};

module.exports = authToken;
