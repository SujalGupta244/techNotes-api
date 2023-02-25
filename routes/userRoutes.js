const express = require('express');
const router = express.Router();

const userControllers = require("../controllers/userController");
const {getAllUsers, createNewUser, updateUser, deleteUser} = userControllers;
const verifyJWT = require('../middleware/verifyJWT')


router.use(verifyJWT)

router.route('/')
    .get(getAllUsers)
    .post(createNewUser)
    .patch(updateUser)
    .delete(deleteUser)

module.exports = router;