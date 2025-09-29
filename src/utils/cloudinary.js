import pkg from 'cloudinary';
const { v2: Cloudinary } = pkg;
import fs from 'fs'
import path from 'path'

Cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

const uploadToCloudinary = async (filePath, folder, resourceType='auto')=>{
    try {
        if(!filePath){
            throw new Error('File path is required')
        }
        const options = {       
            folder,
            resource_type: resourceType,
            use_filename: true,
            unique_filename: false,
            overwrite: true,
        }
        const result = await Cloudinary.uploader.upload(filePath, options)
        
        // Only delete the file if it's in the uploads/temp folder (not your static dummy image)
        const isTempUpload = filePath.includes('uploads') // adjust if your temp folder is named differently
        if (isTempUpload && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
        }
        return result
    } catch (error) {
        // Only try to delete if file exists and is a temp upload
        if (filePath && filePath.includes('uploads') && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
        }
        throw error
    }   
}
export default uploadToCloudinary