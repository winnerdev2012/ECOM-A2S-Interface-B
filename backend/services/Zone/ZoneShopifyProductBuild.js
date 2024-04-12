const axios = require('axios');
const { makeRequest } = require('../../traits/ConsumesExternalServices');
const dotenv = require('dotenv')
dotenv.config();
const { redisClient } = require('../../server');

function syncZoneToMongo(req, res) {
  return new Promise(async (resolve, reject) => {

    let akeneoCallCount = 0;
    let dynamicEndpoint = '&limit=100';
    let productModels;

    async function getAkeneoProductModels() {
      try {
        // Call Akeneo
        let resData = await makeRequest(
          "GET",
          `${process.env.AKENEO_API_URI}product-models?search={"family":[{"operator":"IN","value":["zn_kits"]}]}` + dynamicEndpoint,
          null,
          null,
          null
        );
        let items = resData._embedded.items;
        console.log(`${items.length} product models retrieved from Akeneo on call count ${akeneoCallCount}.`)

        productModels = items;
        // Set next Akeneo page value for the next call
        let nextPageValue =
          resData._links.next === undefined
            ? "end"
            : resData._links.next.href;
        if (nextPageValue !== "end") {
          console.log("Next page value NOT end: ", nextPageValue)
          let urlArray = nextPageValue.split("?");
          dynamicEndpoint = urlArray[1];
        } else if (nextPageValue === "end") {
          console.log("Next page value IS end: ", nextPageValue)
          dynamicEndpoint = nextPageValue;
        }
        akeneoCallCount++;
        checkAndCallAkeneo();
      } catch (err) {
        console.log(err);
      }
    }

    async function checkAndCallAkeneo() {
      if (dynamicEndpoint !== 'end') {
        getAkeneoProductModels(dynamicEndpoint);
      } else {
        getChildProducts();
      }
    }

    async function getChildProducts() {
      console.log('Fetching child products...');
      // Initialize an empty array to store the fetched products
      const shopifyProducts = [];

      // Loop over the product models
      for (let i = 0; i < productModels.length; i++) {
        const skuString = productModels[i].code;
        let newProductObject = {
          productModel: productModels[i],
          childProducts: [],
        }
        // Strip the 'ZON' prefix (case-insensitive) and split the remaining string by underscores
        const skuSuffixes = skuString.toLowerCase().replace(/^zon/, '').split('_');

        // Loop over the SKU suffixes
        for (const currentSkuSuffix of skuSuffixes) {
          console.log(`Fetching product with SKU suffix ${currentSkuSuffix}`);
          // Make the API call to get the product with the current SKU suffix
          const resData = await makeRequest(
            'GET',
            `${process.env.AKENEO_API_URI}products/ZON${currentSkuSuffix.toUpperCase()}`,
            null,
            null,
            null
          );
          // Push the fetched product to the 'childProducts' array
          newProductObject.childProducts.push(resData);
        }
        // Push the fetched product data to the 'products' array
        shopifyProducts.push(newProductObject);
      }
      // Return the array of fetched products

      resolve({
        statusCode: 200,
        body: {
          message: 'Synced product models synced!',
          shopifyProducts: shopifyProducts,
        },
      });
    }

    getAkeneoProductModels();

  }) // End of promise
}

module.exports = {
  syncZoneToMongo,
}