const axios = require('axios');
const env = require('dotenv').config();
const { makeRequest } = require('../../traits/ConsumesExternalServices');

// Configure Cloudinary
const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true
});

const CLOUDINARY_API_BASE_URL = 'https://api.cloudinary.com/v1_1/{{cloud_name}}/resources/search';

async function processAsset(assetCode, cloudName, resourceType) {
  return new Promise(async (resolve, reject) => {
    try {
      const akeneoEndpoint = `https://foxfactory-prod.cloud.akeneo.com/api/rest/v1/assets/${assetCode}`;
      const akeneoResponse = await makeRequest('GET', akeneoEndpoint, {}, {}, {});

      const imageDownloadLink = akeneoResponse.data.reference_files[0]._link.download.href;

      // Get the image data as an ArrayBuffer
      const imageResponse = await makeRequest('GET', imageDownloadLink, {}, {}, {});
      const imageData = Buffer.from(imageResponse.data, 'binary');
      resolve({ imageResponse, imageData });

      // Upload the image to Cloudinary
      // const cloudinaryEndpoint = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
      // const cloudinaryResponse = await axios.post(cloudinaryEndpoint, {
      // file: {
      //     value: imageData,
      //     options: {
      //     filename: 'image.jpg',
      //     contentType: 'image/jpeg'
      //     }
      // }
      // });

      // // Do something with the Cloudinary response
      // console.log(cloudinaryResponse.data);
    } catch (error) {
      console.error(error.message);
    }
  });
}

async function getCloudinaryImageLink(searchString) {
  // console.log("Getting Cloudinary Image Link for: ", searchString)
  return new Promise(async (resolve, reject) => {
    let transformedString = searchString.replace(/_/g, ' AND ');
    if (transformedString.endsWith(' AND ')) {
      transformedString = transformedString.slice(0, -5);
    }
    // console.log("Here is the transformed string: ", transformedString)
    const options = {
      expression: transformedString,
      max_results: 30,
      resource_type: 'image'
    };
    let result;
    cloudinary.search.expression(options.expression)
      .max_results(options.max_results)
      .execute().then((searchResult) => {

        resolve(searchResult);
        // if (searchResult) {
        //     result = searchResult;
        // } else {
        //     result = searchResult;
        // }
      });

    //   if (result) {
    //     resolve(result);
    //   } 
  });
}

// Export modules
module.exports = {
  processAsset,
  getCloudinaryImageLink
}