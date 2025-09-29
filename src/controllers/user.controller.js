import asyncHandler from '../utils/asyncHandler.js'
import apiError from '../utils/apiError.js'
import User from '../models/user.model.js'
import uploadToCloudinary from '../utils/cloudinary.js'
import ApiResponse from '../utils/apiResponse.js'
import jwt from 'jsonwebtoken'

const generateAccessTokenAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        if (!user) {
            throw new apiError(404, 'User not found')
        }
        const refreshToken = user.generateRefreshToken()
        const accessToken = user.generateAccessToken()
        user.refreshToken = refreshToken
        await user.save({
            validateBeforeSave: false,
        })
        return { accessToken, refreshToken }
    } catch (error) {
        throw new apiError(500, 'Failed to generate tokens')
    }
}

const registerUser = asyncHandler(async (req, res) => {
    // Debug: Log incoming request body and files
    console.log('BODY:', req.body)
    console.log('FILES:', req.files)

    // Extract user data from request body
    const { username, fullName, email, password } = req.body

    // Validate required fields
    if (
        [username, fullName, email, password].some(
            (field) => !field || field.trim() === ''
        )
    ) {
        throw new apiError(400, 'All fields are required')
    }

    // Check if user already exists (by username or email)
    const existingUser = await User.findOne({ $or: [{ username }, { email }] })
    if (existingUser) {
        throw new apiError(409, 'Username or email already exists')
    }

    // Get avatar file path, use dummy image if not uploaded
    const avatar =
        req.files['avatar'] && req.files['avatar'][0]
            ? req.files['avatar'][0].path
            : 'src/utils/utilsImages/profile.png' // fallback dummy image

    // Get cover image file path, or null if not uploaded
    const coverImage =
        req.files['coverImage'] && req.files['coverImage'][0]
            ? req.files['coverImage'][0].path
            : null

    // Avatar is required (even if dummy)
    if (!avatar) {
        throw new apiError(400, 'Avatar is required')
    }

    // Upload avatar to Cloudinary
    const avatarOnCloudinary = await uploadToCloudinary(avatar, 'avatar')

    // Upload cover image to Cloudinary only if provided
    let coverImageOnCloudinary = null
    if (coverImage) {
        coverImageOnCloudinary = await uploadToCloudinary(
            coverImage,
            'coverImage'
        )
    }

    // Check if avatar upload succeeded
    if (!avatarOnCloudinary) {
        throw new apiError(500, 'Failed to upload avatar image to cloudinary')
    }

    // Create new user in database
    const newUser = await User.create({
        username: username.toLowerCase(),
        fullName: fullName,
        email: email.toLowerCase(),
        password,
        avatar: avatarOnCloudinary.url,
        coverImage: coverImageOnCloudinary?.url || '',
    })

    // Fetch created user without sensitive fields
    const createdUser = await User.findById(newUser._id).select(
        '-password -__v -createdAt -updatedAt -refreshToken'
    )

    if (!createdUser) {
        throw new apiError(500, 'Failed to create user')
    }

    // Send success response
    return res.status(201).json(
        new ApiResponse(201, 'User registered successfully', {
            user: createdUser,
        })
    )
})

const loginUser = asyncHandler(async (req, res) => {
    console.log('login req body ', req.body)
    const { email, password, username } = req.body

    if (!(email || username)) {
        throw new apiError(400, 'Email or Username is required')
    }

    const query = []

    if (username) query.push({ username: username.toLowerCase() })
    if (email) query.push({ email: email.toLowerCase() })

    const user = await User.findOne({
        $or: query,
    })

    if (!user) {
        throw new apiError(404, 'User not found')
    }

    const isPasswordValid = await user.isPasswordMatch(password)

    if (!isPasswordValid) {
        throw new apiError(401, 'Invalid user credentials')
    }

    const { accessToken, refreshToken } =
        await generateAccessTokenAndRefreshToken(user._id)

    const logedInUser = await User.findById(user._id).select(
        '-password  -refreshToken'
    )

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
        .status(200)
        .cookie('refreshToken', refreshToken, options)
        .cookie('accessToken', accessToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: logedInUser,
                    accessToken,
                    refreshToken,
                },
                'User logged in successfully'
            )
        )
})

const logoutUser = asyncHandler(async (req, res) => {
    // Implementation for user logout (not provided in the original snippet)
    const userId = req.user._id
    const user = await User.findById(userId)
    if (!user) {
        throw new apiError(404, 'User not found')
    }
    user.refreshToken = null
    await user.save({ validateBeforeSave: false })
    res.clearCookie('accessToken')
    res.clearCookie('refreshToken')
    return res
        .status(200)
        .json(new ApiResponse(200, 'User logged out successfully'))
})
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken) {
        throw new apiError(401, 'unauthorized request')
    }
  try {
      const decodedToken = jwt.verify(incomingRefreshToken,process.env.JWT_SECRET)

    const user = await User.findById(decodedToken?.userId)

    if(!user){
        throw new apiError(404, 'invalid request, user not found')
    }

    if(user.refreshToken !== incomingRefreshToken){
        throw new apiError(401, 'unauthorized request, token mismatch')
    }

    const options = {
        httpOnly: true,
        secure: true,
    }
    const {newRefreshToken , accessToken} = await generateAccessTokenAndRefreshToken(user._id)

    return res.status(200).cookie('accessToken', accessToken, options)
    .cookie('refreshToken', newRefreshToken, options)
    .json(new ApiResponse(200, {
        accessToken,
        newRefreshToken
    } , 'Access token refreshed successfully'))

    
  } catch (error) {
    throw new apiError(401, 'unauthorized request, invalid token')
  }
})
export { registerUser, loginUser, logoutUser , refreshAccessToken }
