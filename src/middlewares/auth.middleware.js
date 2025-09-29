import asyncHandler from "../utils/asyncHandler.js";
import jwt  from "jsonwebtoken";
import User from "../models/user.model.js";
import apiError from "../utils/apiError.js";


export const verifyJWT = asyncHandler(async (req, res, next) => {
    // Implementation for JWT verification (not provided in the original snippet)
    const token = req.cookies.accessToken || req.headers.authorization?.split(' ')[1]
    if (!token) {
        throw new apiError(401, 'No token provided')
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = await User.findById(decoded.id).select('-password -refreshToken')
        if (!req.user) {
            throw new apiError(401, 'User not found')
        }
        next()
    } catch (error) {
        throw new apiError(401, 'Invalid token')
    }   
})
