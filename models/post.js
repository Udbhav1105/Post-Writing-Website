import mongoose from 'mongoose';
// import user from './user.js';

const postSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    content: String,
    date:{
        type: Date,
        default: Date.now
    },
    likes:[
        {
        type:mongoose.Schema.Types.ObjectId,
        ref:'user'
    }
]
});

const postModel = mongoose.model('post', postSchema);
export default postModel;
