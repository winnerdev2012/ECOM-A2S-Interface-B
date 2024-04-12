const axios = require('axios');
const { makeRequest } = require('../../traits/ConsumesExternalServices');
const cloudinary = require('cloudinary').v2;
const { resolveAuthorization } = require('../../traits/AuthorizeRequests');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

async function processAsset(assetCode) {
  return new Promise(async (resolve, reject) => {
    try {
      const akeneoResponse = await makeRequest('GET', `${process.env.AKENEO_API_URI}assets/${assetCode}`, {}, {}, {});
      const response = await axios.get(akeneoResponse.reference_files[0]._link.download.href, { responseType: 'arraybuffer', headers: { 'Authorization': await resolveAuthorization() }});

      cloudinary.uploader.upload_stream({ resource_type: 'image' }, (error, result) => {
        if (error) {
          console.error('Image upload failed:', error);
          reject(error);
        } else {
          console.log('Image uploaded successfully:', result.secure_url);
          resolve(result.secure_url);
        }
      }).end(response.data);
    } catch (error) {
      reject(error);
    }
  });
}

async function getCloudinaryImageLink(searchString) {
  return new Promise(async (resolve) => {
    let transformedString = searchString.replace(/__/g, ' AND ').replace(/_/g, ' AND ');
    if (transformedString.endsWith(' AND ')) {
      transformedString = transformedString.slice(0, -5);
    }
    
    const options = {
      expression: transformedString,
      max_results: 30,
      resource_type: 'image'
    };

    cloudinary.search.expression(options.expression).max_results(options.max_results).execute().then((searchResult) => {
      resolve(searchResult);
    });
  });
}

// Export modules
module.exports = {
  processAsset,
  getCloudinaryImageLink
}