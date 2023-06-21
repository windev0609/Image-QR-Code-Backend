const express = require("express");
const authRouter = require("./auth");
const authToken = require("../middleware/authToken");

const app = express();

app.use("/auth/", authRouter);

module.exports = app;
