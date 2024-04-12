const dotenv = require('dotenv')
dotenv.config()
const axios = require('axios')
const base64 = require('base-64')
const { redisClient } = require("../../server")

const {
  AKENEO_STAGING_CLIENT_ID,
  AKENEO_STAGING_CLIENT_SECRET,
  AKENEO_STAGING_AUTH_URL,
  AKENEO_STAGING_REST_URL,
  AKENEO_STAGING_USERNAME,
  AKENEO_STAGING_PASSWORD
} = process.env

// MongoDB Models
const SsgForkProduct = require('../../models/SSG/SsgFork')

// Akeneo Product State
let dynamicEndpoint = "&limit=100";
let akeneoCallCount = 0;

async function getClientCredentialsToken() {
  // Check Redis for token
  const redisKey = 'akeneo_staging_access_token';
  const redisToken = await redisClient.getAsync(redisKey);
  if (redisToken) {
    return `Bearer ${redisToken}`;
  }

  const encode_string = `${AKENEO_STAGING_CLIENT_ID}:${AKENEO_STAGING_CLIENT_SECRET}`;
  const auth_string = base64.encode(encode_string);
  const data = {
    username: AKENEO_STAGING_USERNAME,
    password: AKENEO_STAGING_PASSWORD,
    grant_type: 'password',
  };
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${auth_string}`
  };
  const options = {
    method: 'POST',
    url: AKENEO_STAGING_AUTH_URL,
    data: data,
    headers: headers
  };
  const response = await axios(options);
  const tokenData = response.data;

  // Save token to Redis
  await redisClient.setAsync(redisKey, tokenData.access_token);
  await redisClient.expireAsync(redisKey, tokenData.expires_in);

  return `Bearer ${tokenData.access_token}`;
}

async function getAkeneoStagingProducts() {
  return new Promise(async (resolve, reject) => {
    // Check Redis for products
    const akeneoKeys = await redisClient.keysAsync("akeneoStagingProduct-*");
    if (akeneoKeys.length > 0 && akeneoCallCount === 0) {
      const akeneoProducts = await redisClient.mgetAsync(akeneoKeys)
      // Parse all products from Redis
      for (let i = 0; i < akeneoProducts.length; i++) {
        akeneoProducts[i] = JSON.parse(akeneoProducts[i])
      }
      resolve(akeneoProducts);
    } else {
      const axiosClient = axios.create({
        paramsSerializer: {
          serialize: (params) => Qs.stringify(params, { arrayFormat: 'brackets' })
        },
      });

      try {
        const options = {
          method: 'GET',
          url: `${AKENEO_STAGING_REST_URL}/products?${dynamicEndpoint}`,
          params: null,
          data: {},
          headers: {
            'Content-Type': 'application/json',
            'Authorization': await getClientCredentialsToken()
          }
        };
        let resData = await axiosClient(options)
        let items = resData.data._embedded.items;
        for (let item of items) {
          // Set general product data in Redis
          await redisClient.setAsync(
            "akeneoStagingProduct-" + item.identifier,
            JSON.stringify(item)
          );
        }
        // Set next Akeneo page value for the next call
        let nextPageValue =
          resData.data._links.next === undefined
            ? "end"
            : resData.data._links.next.href;
        if (nextPageValue !== "end") {
          let urlArray = nextPageValue.split("?");
          dynamicEndpoint = urlArray[1];
        } else if (nextPageValue === "end") {
          dynamicEndpoint = nextPageValue;
        }
        akeneoCallCount++;
        const akeneoCheckResult = checkAndCallAkeneo();
        if (akeneoCheckResult === "end") {
          // Get all products from Redis
          const akeneoProducts = await redisClient.mgetAsync(akeneoKeys)
          // Parse all products from Redis
          for (let i = 0; i < akeneoProducts.length; i++) {
            akeneoProducts[i] = JSON.parse(akeneoProducts[i])
          }
          resolve(akeneoProducts);
        }

      } catch (err) {
        console.log(err);
      }
    }
  });
}

async function getSsgJsonExtract() {
  let ssgJsonArray = [];
  // Get products from Redis 
  const redisKeys = await redisClient.keysAsync("akeneoStagingProduct-*");
  const redisProducts = await redisClient.mgetAsync(redisKeys);
  // Parse all products from Redis
  for (let i = 0; i < redisProducts.length; i++) {
    redisProducts[i] = JSON.parse(redisProducts[i])
  }
  // Filter products to only include SSG forks
  const ssgProducts = redisProducts.filter(product => product.family === "SSG_forks");
  // Create JSON object for each product
  ssgJsonArray = ssgProducts.map(product => {

    const findSeriesValue = product.categories.find(val => val.startsWith("SSG_M_Series"));
    const findFamilyValue = product.categories.find(val => val.startsWith("SSSG_M_")) || product.categories.find(val => val.startsWith("SSG_M_"));

    const seriesResult = findSeriesValue ? findSeriesValue.split("Series")[1] : null;
    const familyResult = findFamilyValue.startsWith("SSG_M_") ? findFamilyValue.split("SSG_M_")[1] : findFamilyValue.split("SSSG_M_")[1];

    const ssgJson = {
      sku: product.identifier,
      title: product.values.title !== undefined ? product.values.title[0].data : product.values.title,
      category_level_1: product.family === "SSG_forks" ? "Fork" : "Not a fork",
      family: familyResult ?? product.categories,
      series: seriesResult ?? "No Series",
      damper: product.values.ssg_damper !== undefined ? product.values.ssg_damper[0].data : null,
      travel: product.values.ssb_travel !== undefined ? product.values.ssb_travel[0].data : null,
      color: product.values.ssb_color !== undefined ? product.values.ssb_color[0].data : null,
      image: product.values.product_media !== undefined ? product.values.product_media[0].data[0] : null,
      ref_entity: product.values.SSG_Recommendations_Table1 !== undefined ? product.values.SSG_Recommendations_Table1[0].data[0] : null,
    }
    return ssgJson
  })

  // Save array to MongoDB
  const ssgJsonCollection = await SsgForkProduct.create(ssgJsonArray);

  return ssgJsonCollection

}

function getAkeneoSsgRefEntityData(refEntityCodeArr) {
  return new Promise(async (resolve, reject) => {
    const axiosClient = axios.create({
      paramsSerializer: {
        serialize: (params) => Qs.stringify(params, { arrayFormat: 'brackets' })
      },
    });

    try {
      const options = {
        method: 'GET',
        url: `${AKENEO_STAGING_REST_URL}/reference-entities/ssg_recommendations/records`,
        params: null,
        data: {},
        headers: {
          'Content-Type': 'application/json',
          'Authorization': await getClientCredentialsToken()
        }
      };
      let resData = await axiosClient(options)
      let items = resData.data._embedded.items;
      const refEntityCode = refEntityCodeArr[0]
      // Look for the ref entity code in the array of items
      for (let item of items) {
        if (item.code === refEntityCode) {
          // resolve(item.values.recommendationstring[0].data)
          resolve(item)
        }
      }

    } catch (err) {
      console.log(err);
    }
  });
}

// Check to see if we are at the end of products
async function checkAndCallAkeneo() {
  if (dynamicEndpoint !== "end") {
    getAkeneoStagingProducts(dynamicEndpoint)
    return dynamicEndpoint
  } else {
    return dynamicEndpoint
  }
}

module.exports = {
  getClientCredentialsToken,
  getSsgJsonExtract,
  getAkeneoStagingProducts,
  getAkeneoSsgRefEntityData
};