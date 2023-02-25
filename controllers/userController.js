const User = require("../models/User");
const Note = require("../models/Note")

const asyncHandler = require("express-async-handler"); 
// "express-async-errors" same as express-async-handler but only need to require in main server file
const bcrypt = require("bcrypt");


// @desc Get all users
// @route GET /users
// @access Private
const getAllUsers = asyncHandler(async(req, res) =>{
    const users = await User.find().select("-password").lean();
    if(!users?.length){
        return res.status(400).json({message:"No users found"});
    }
    res.json(users);
})

// @desc Create new user
// @route POST /users
// @access Private
const createNewUser = asyncHandler(async(req, res) =>{
    const {username, password, roles} = req.body;

    // Confirm data
    if(!username || !password ){
        return res.status(400).json({message:"All fields are required"})
    }

    // Check for duplicate
    const duplicate = await User.findOne({username}).collation({locale: "en", strength: 2}).lean().exec();

    if(duplicate){
        return res.status(400).json({message: "UserName already exists"});
    }

    // Hash Password
    const hashedPwd = await bcrypt.hash(password, 10) //salt rounds

    const userObject = (!Array.isArray(roles) || !roles.length)
    ?{username, "password": hashedPwd}
    :{username, "password": hashedPwd, roles}
    

    // Create and store new user
    const user = await User.create(userObject)

    if(user){ // if created
        res.status(201).json({message: `new user ${username} created`})
    }else{
        res.status(400).json({message: "Invalid user data received"});
    }
})


// @desc Update user
// @route PATCH /users
// @access Private
const updateUser = asyncHandler(async(req, res) =>{
    const {id, username, roles, active, password} = req.body;
    if(!id || !username || !Array.isArray(roles) || !roles.length || typeof active !== "boolean"){
        return res.status(400).json({message: "some properties are missing"});
    }

    const user = await User.findById(id).exec();
    if(!user){
        return res.status(400).json({message: "User not found"});
    }
    
    // Check for duplicate
    const duplicate = await User.findOne({username}).collation({locale: 'en', strength: 2}).lean().exec();

    // Allow updates to the original user
    if(duplicate &&duplicate?._id.toString() !== id){
        return res.status(409).json({message: "Username already exists"});
    }

    user.username = username;
    user.roles = roles;
    user.active = active;

    if(password){
        // hash password
        user.password = await bcrypt.hash(password,10);
    }

    const updatedUser = await user.save();
    
    return res.status(200).json({message: `${updatedUser.username} updated`})
    
})

// @desc Delete user
// @route DELETE /users
// @access Private
const deleteUser = asyncHandler(async(req, res) =>{
    const {id} = req.body;

    if(!id){
        return res.status(400).json({message: "User Id required"});
    }

    const note = await Note.findOne({user: id}).lean().exec();

    if(note){
        return res.status(400).json({message: "User has assigned notes"})
    }

    const user = await User.findById(id).exec();

    if(!user){
        return res.status(400).json({message: "User not found"});
    }

    const result = await user.deleteOne();
    const reply = `Username ${result.username} with ID ${result._id} deleted`;
    res.json({reply});
})


module.exports = {getAllUsers, createNewUser, updateUser, deleteUser};