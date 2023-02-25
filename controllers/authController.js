const User = require("../models/User")
const bcrypt = require('bcrypt')
const jwt = require("jsonwebtoken")
const asyncHandler = require('express-async-handler')

// @desc Login
// @route POST /auth
// @access Public
const login = asyncHandler(async (req,res) =>{
    const {username, password} = req.body;
    if(!username || !password){
        res.status(400).json({message: "All fields are required"})
    }

    const foundUser = await User.findOne({username}).exec()
    if(!foundUser || !foundUser.active){
        res.status(401).json({message: "Unauthorized"})
    }

    const match = bcrypt.compare(password, foundUser.password)

    if(!match){
        res.status(401).json({message: "Unauthorized"})
    }

    const accessToken = jwt.sign(
        {
            "UserInfo":{
                "username": foundUser.username,
                "roles": foundUser.roles
            }
        },
        process.env.ACCESS_TOKEN_KEY,
        {expiresIn: "15m"}
    )
    
    const refreshToken = jwt.sign(
        {"username": foundUser.username}
        ,process.env.REFRESH_TOKEN_KEY, 
        {expiresIn: "7d"}
    )

    // Create secure cookie with refresh token
    res.cookie("jwt",refreshToken, {
        httpOnly: true, // accessible only by web server
        secure: true, // https
        sameSite: 'None', // cross-site cookie
        maxAge: 7*24*60*60*1000 //cookies expiry : set to match 
    })
    return res.json({accessToken})
})


// @desc Refresh
// @route GET /auth/refresh
// @access Public - because access token has expired
const refresh = asyncHandler(async (req,res) =>{
    const cookies = req.cookies

    if(!cookies?.jwt) res.status(401).json({message: "Unauthorized"})

    const refreshToken = cookies.jwt

    jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_KEY,
        asyncHandler(async (err, decoded) =>{
            if(err) return res.status(403).json({message: "Forbidden"})

            const foundUser = await User.findOne({username: decoded.username})

            if(!foundUser) return res.status(401).json({message: "Unauthorized"})

            const accessToken = jwt.sign(
                {
                    "UserInfo":{
                        "username": foundUser.username,
                        "roles": foundUser.roles
                    }
                },
                process.env.ACCESS_TOKEN_KEY,
                {expiresIn: "15m"}
            )

            res.json({accessToken})

            
        })
    )
})

// @desc Logout
// @route POST /auth/logout
// @access Public - just to clear cookie if exists 
const logout = asyncHandler(async (req,res) =>{
    const cookies = req.cookies;
    if(!cookies?.jwt)return res.sendStatus(204); //No content
    
    res.clearCookie("jwt",{httpOnly: true, sameSite: "None", secure: true}); //secure: true - only serves on https
    res.json({message:"cookie cleared"}) 
})

module.exports = {
    login,
    refresh,
    logout
}
