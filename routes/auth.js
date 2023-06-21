const express = require("express");
const AuthController = require("../controllers/AuthController");
const router = express.Router();

router.post("/login", AuthController.signIn);
router.post("/signup", AuthController.signUp);
router.post("/setPassword", AuthController.setPassword);
router.post(" /forgetPassword", AuthController.forgetPassword);

module.exports = router;
