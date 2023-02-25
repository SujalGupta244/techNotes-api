const mongoose = require("mongoose");

const connectDB = async () =>{
    try{
        await mongoose.connect(process.env.DATABASE_URI)
        // await mongoose.set('strictQuery',false)
    }catch(err){
        console.error(err);
    }
}


module.exports = connectDB;