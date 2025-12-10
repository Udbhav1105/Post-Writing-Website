const mongoose = require('mongoose');
const user = require('./user');

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

module.exports=mongoose.model('post', postSchema);