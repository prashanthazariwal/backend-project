import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new mongoose.Schema({
    title: {
        type: String,   
        required: true,
        trim: true,
        index: true,    
        maxlength: 300,
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000,
    },  
    videoFile: {
        type: String, // cloudinary public id
        required: true, 
        trim: true,
        unique: true,
        index: true,
    },
    thumbnail: {
        type: String, // cloudinary public id
        required: true,
        trim: true,
        unique: true,
        index: true,
    },
    views: {
        type: Number,
        default: 0,
        min: 0,
    },
    duration: {
        type: Number, // in seconds
        required: true,
        trim: true,
        index: true,
    },
    isPublished: {
        type: Boolean,
        default: false,
    },
    likes: [    
        {
            type: mongoose.Schema.Types.ObjectId,   
            ref: 'User',
        }
    ],
    dislikes: [ 
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        }
    ],
    category: {
        type: String,
        required: true,
        trim: true,
        index: true,
    },  
    owner: {
        type: mongoose.Schema.Types.ObjectId,   
        ref: 'User',
        required: true,
    }
}, { timestamps: true })

videoSchema.plugin(mongooseAggregatePaginate)
export default mongoose.model('Video', videoSchema)