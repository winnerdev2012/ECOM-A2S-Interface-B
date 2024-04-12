const CLOUDINARY_URL = 'cloudinary://238981913914568:qblfwhtGMSdHsZehoXWQjkuN3h8@stusa'
const CLOUD_NAME = 'stusa'
const CLOUDINARY_API_KEY = '238981913914568'
const CLOUDINARY_API_SECRET = 'qblfwhtGMSdHsZehoXWQjkuN3h8'

const cloudinary = require('cloudinary').v2

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET
})



const uploadImage = async (imagePath, imagePublicId) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(imagePath, { public_id: imagePublicId }, (error, result) => {
      if (error) {
        reject(error)
      } else {
        resolve(result)
      }
    })
  })
}

const deleteImage = async (imagePublicId) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(imagePublicId, (error, result) => {
      if (error) {
        reject(error)
      } else {
        resolve(result)
      }
    })
  })
}

module.exports = {
  uploadImage,
  deleteImage
}