import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI);

const userSchema = new mongoose.Schema({
    username: String,
    name: String,
    age: Number,
    email: String,
    password: String,
    profile:{
        type:String,
        default:"default.png"
    },
    posts:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:'post'
        }
    ]
});

const userModel = mongoose.model('User', userSchema); 
export default userModel;