import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true,
            lowercase : true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        avatar: {
            type: String, // cloudinary public id
            required: true,
        },
        coverImage: {       
            type: String, // cloudinary public id
            default: null,
        },
        watchHistory: [
            {
                type: mongoose.Schema.Types.ObjectId,   
                ref: 'Video',
            }
        ],
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: 6,
        },
        refreshToken: {
            type: String,
            default: null,
        }
    },
    { timestamps: true }
)

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next()
    }
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
})

userSchema.methods.isPasswordMatch = async function (password) {
    return await bcrypt.compare(password, this.password)
}
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        { userId: this._id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    )
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        { userId: this._id },   
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    )
}


export default mongoose.model('User', userSchema)
