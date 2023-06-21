const User = require("../models/UserModel.js");
const isEmpty = require("is-empty");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;
var nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");

const {
  SUCCESS,
  SERVERERROR,
  NOTFOUND,
  EMAILORPASSWORDINVAID,
  EXIST,
} = require("../constants/errorCode");

const {
  SUCCESSMSG,
  SERVERERRORMSG,
  NOTFOUNDMSG,
  EMAILORPASSWORDINVAIDMSG,
  EXISTMSG,
} = require("../constants/errorMessage");
require("dotenv").config();

exports.signIn = async (req, res) => {
  try {
    let user;
    const { mail, type } = req.body;

    user = await User.findOne({
      mail: mail,
      mail_type: parseInt(type),
      isActive: true,
    });

    if (!user) {
      user = await User.create({
        mail: mail,
        mail_type: type,
        isActive: true,
      });
    }
    const token = jwt.sign({ id: user._id }, process.env.token_key, {
      expiresIn: 86400,
    });
    return res.status(SUCCESS).json({ user: user, token: token });
  } catch (error) {
    return res.status(SERVERERROR).json({ message: SERVERERRORMSG });
  }
};

exports.signUp = async (req, res, next) => {
  const { mail } = req.body;

  if (isEmpty(mail)) {
    return res.json(SERVERERRORMSG, {
      email: "email is invalid",
    });
  }

  User.findOne({ mail: mail })
    .then((user) => {
      if (user) {
        return res.json(EXIST, {
          email: "Email already exists",
        });
      } else {
        try {
          var token = jwt.sign({ mail: mail }, process.env.token_key, {
            expiresIn: 86400,
          });

          const oauth2Client = new OAuth2(
            process.env.CLIENT_ID,
            process.env.CLIENT_SECRET,
            "https://developers.google.com/oauthplayground"
          );
          oauth2Client.setCredentials({
            refresh_token: process.env.REFRESHTOKEN,
          });
          const accessToken = (resolve, reject) => {
            oauth2Client.getAccessToken((err, token) => {
              if (err) {
                reject("Failed to create access token :(");
              }
              resolve(token);
            });
          };
          const transport = nodemailer.createTransport({
            service: "gmail",
            auth: {
              type: "OAuth2",
              user: process.env.USER,
              accessToken: accessToken,
              clientId: process.env.CLIENT_ID,
              clientSecret: process.env.CLIENT_SECRET,
              refreshToken: process.env.REFRESHTOKEN,
            },
            tls: {
              rejectUnauthorized: false,
            },
          });
          transport
            .sendMail({
              from: process.env.USER,
              to: mail,
              subject: "Please confirm your account",
              html: `<h3>Hello ${mail}!</h3>
            <h3>Thank you for using MOMENTO_NOTES Page.</h3>
            <h4>You can click <a href=http://localhost:8081/setPassword?token=${token}>Click Here</a> to set the PASSWORD</h4>
            </div>`,
            })
            .catch((err) => {
              console.log(err);
              return;
            });
          User.create(req.body);
        } catch (e) {
          console.log(e);
          return res.status(SERVERERROR).json({ message: SERVERERRORMSG });
        }
        return res.status(SUCCESS).json({ user: user });
      }
    })
    .catch((err) => {
      console.log(err);
      return res.json(SERVERERROR).json(SERVERERRORMSG);
    });
};

exports.setPassword = (req, res, next) => {
  jwt.verify(req.body.token, (err, decoded) => {
    if (err) {
      console.log(err);
      return res.status(401).send({
        message: "Unauthorized!",
      });
    } else {
      console.log(decoded);
      bcrypt.genSalt(10, (err, salt) => {
        console.log(req.body);
        bcrypt.hash(req.body.password, salt, (err, hash) => {
          if (err) throw err;
          console.log(hash);
          User.updateOne(
            { mail: decoded.email },
            process.env.token_key,
            {
              password: hash,
            },
            (err) => {
              if (err) {
                console.log(err);
              } else {
                return res.json({ result: "update success" });
              }
            }
          );
        });
      });
    }
  });
};

exports.forgetPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email });
  var token = jwt.sign({ mail: mail }, process.env.token_key, {
    expiresIn: 86400,
  });
  if (isEmpty(user)) return res.json(res, NOTFOUND, NOTFOUNDMSG);
  else {
    const oauth2Client = new OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      "https://developers.google.com/oauthplayground"
    );
    oauth2Client.setCredentials({
      refresh_token: process.env.REFRESHTOKEN,
    });
    const accessToken = new Promise((resolve, reject) => {
      oauth2Client.getAccessToken((err, token) => {
        if (err) {
          reject("Failed to create access token :(");
        }
        resolve(token);
      });
    });
    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.USER,
        accessToken: accessToken,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESHTOKEN,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    transport
      .sendMail({
        from: process.env.USER,
        to: email,
        subject: "Please confirm your account",
        html: `<h3>Hello ${email}!</h3>
              <h3>Thank you for using MOMENTO_NOTES Page.</h3>
              <h4>You can click <a href=http://localhost:8081/setPassword?token=${token}>Click Here</a> to reset the PASSWORD</h4>
              </div>`,
      })
      .catch((err) => console.log("error", err));
    return res.json(SUCCESS);
  }
};
