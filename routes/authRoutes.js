const express = require("express")
const router = express.Router()
const loginLimiter = require("../middleware/loginLimiter")
const authController = require("../controllers/authController")
const {login, logout, refresh} = authController

router.route('/')
    .post(loginLimiter, login)

router.route('/refresh')
    .get(refresh)

router.route('/logout')
    .post(logout)

module.exports = router;