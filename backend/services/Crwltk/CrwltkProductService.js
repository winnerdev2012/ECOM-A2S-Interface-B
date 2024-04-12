const axios = require('axios');
const makeGraphQlRequest = require('../../traits/graphql/MakesGraphQlRequest');
const { makeRequest } = require('../../traits/ConsumesExternalServices');
const dotenv = require('dotenv');
dotenv.config();
const Constants = require('../../traits/graphql/schema/Akeneo/Constants');
const { updateShopifyProduct, createShopifyProduct } = require('../../traits/graphql/schema/Crwltk/CrwltkProductRequests');
const { updateShopifyProductMetafields, createShopifyProductMetafields } = require('./CrwltkMetafieldUpdateService');
const { createProductTags } = require('./CrwltkTagsService');
const { redisClient } = require('../../server');
const { processAsset, getCloudinaryImageLink } = require('./CloudinaryImageService');
// const ZnCloudinaryUrl = require('../../models/Crwltk/CrwltkCloudinaryUrls');

function syncCrwltkProducts() {
  return new Promise(async (resolve) => {
    let shopifyProductList = [];
    let crwltkProductsUpdate = [];
    let crwltkProductsCreate = [];

    // Find products in Redis, and clear of all Crwltk products and Shopify products
    const redisCrwltkKeys = await redisClient.keysAsync("crwltkSyncProducts-*");
    const redisShopifyKeys = await redisClient.keysAsync("crwltkShopifyProducts-*");
    if (redisCrwltkKeys.length > 0) {
      await redisClient.delAsync(redisCrwltkKeys);
    }
    if (redisShopifyKeys.length > 0) {
      await redisClient.delAsync(redisShopifyKeys);
    }

    async function getShopifyProductList() {
      let query = Constants.GET_SHOPIFY_PRODUCTS();
      do {
        const response = await makeGraphQlRequest(process.env.CRAWLTEK_GRAPHQL_URI, query, process.env.CRAWLTEK_SECRET, null, false);
        query = response.data.products.edges.length < 30? null : Constants.GET_SHOPIFY_PRODUCTS_WITH_CURSOR(response.data.products.edges[29].cursor);
        shopifyProductList = shopifyProductList.concat(response.data.products.edges);
      } while (query);

      await Promise.all(shopifyProductList.map(async product => {
        await redisClient.setAsync("crwltkShopifyProducts-" + product.node.variants.edges[0].node.sku, JSON.stringify(product));
      }));

      getAkeneoProducts();
    };

    async function getAkeneoProducts() {
      let akeneoProducts = [];
      let nextUrl = `${process.env.AKENEO_API_URI}products?limit=100`;
      do {
        const resData = await makeRequest("GET", nextUrl, null, null, null);
        console.log(resData._links.self.href);
        akeneoProducts = akeneoProducts.concat(resData._embedded.items.filter(item => item.parent === null));
        nextUrl = resData._links?.next?.href;
      } while (nextUrl);

      await Promise.all(akeneoProducts.map(async product => {
        await redisClient.setAsync("crwltkSyncProducts-" + product.identifier, JSON.stringify(product));
      }));

      const productsSynced = await handleProductSync();
      resolve({ statusCode: 200, body: { message: 'Synced products!', shopifyProducts: productsSynced } });
    }

    async function handleProductSync() {
      console.log("Handle sync called...");
      return new Promise(async (resolve, reject) => {
        let productsSynced = {
          productSyncData: [],
          shopifyProductResponse: [],
          cloudinaryImageUrls: [],
        };

        // Get all products from Redis
        const redisCrwltkKeys = await redisClient.keysAsync("crwltkSyncProducts-*");
        let rediscrwltkProducts = [];
        if (redisCrwltkKeys.length > 0) {
          rediscrwltkProducts = await redisClient.mgetAsync(redisCrwltkKeys);
        }

        // Get all Shopify products from Redis
        const redisShopifyKeys = await redisClient.keysAsync("crwltkShopifyProducts-*");
        let redisShopifyProducts = [];
        if (redisShopifyKeys.length > 0) {
          redisShopifyProducts = await redisClient.mgetAsync(redisShopifyKeys);
        }

        // Parse all Crwltk Akeneo products from Redis
        let crwltkProductsParsed = [];
        rediscrwltkProducts.forEach((product) => {
          crwltkProductsParsed.push(JSON.parse(product));
        });

        // Parse all Shopify products from Redis
        redisShopifyProducts.forEach((product) => {
          shopifyProductList.push(JSON.parse(product));
        });

        for (let i = 0; i < crwltkProductsParsed.length; i ++) {
          let newProductObj = {}
          let akeneoProduct = crwltkProductsParsed[i];
          let akeneoKey = i;

          newProductObj[akeneoProduct.identifier] = {
            shopifyId: null,
            akeneoObj: null,
          }
          let productExists = false;

          for (let j = 0; j < shopifyProductList.length; j ++) {
            let shopifyProduct = shopifyProductList[j];
            let shopifyKey = j;
            // console.log(akeneoProduct.identifier, crwltkProductsUpdate[akeneoProduct.identifier])
            if (shopifyProduct && shopifyProduct.node.variants.edges[0].node.sku === akeneoProduct.identifier) {
              // Check for meta title and description
              let shopifyMetafields = {};
              let hasMetafields = false;
              if (shopifyProduct.node.metafields.edges.length > 0) {
                // console.log('Product has metafields')
                shopifyProduct.node.metafields.edges.forEach(edge => {
                  shopifyMetafields[edge.node.key] = edge.node;
                });
                hasMetafields = true;
              }

              // Filter products from arrays
              productExists = true;
              newProductObj[akeneoProduct.identifier].shopifyId = shopifyProduct.node.id;
              // Add metafields to object if they
              if (hasMetafields) {
                newProductObj[akeneoProduct.identifier]['hasMetafields'] = true;
                newProductObj[akeneoProduct.identifier]['shopifyMetafields'] = shopifyMetafields;
              }
              newProductObj[akeneoProduct.identifier]['akeneoObj'] = akeneoProduct;
              crwltkProductsUpdate.push(newProductObj);
              // Remove from shopify array
              shopifyProductList.splice(shopifyKey, 1);
              // Remove from akeneo array
              crwltkProductsParsed.splice(akeneoKey, 1);
            }
          }

          // Create new product if not in store
          if (productExists === false) {
            if ((akeneoProduct.values.PVG_Publish && akeneoProduct.values.PVG_Publish[0].data.includes("PVG_CRL_SIte") && akeneoProduct.enabled)) {
              console.log("Product does not exist in Shopify: ", akeneoProduct.identifier);
              newProductObj[akeneoProduct.identifier]['akeneoObj'] = akeneoProduct;
              crwltkProductsCreate.push(akeneoProduct);
            }
          }
        };

        // Sync filtered products to Shopify
        // for (let i = 0; i < crwltkProductsUpdate.length; i ++) {
        //   let crwltkProduct = crwltkProductsUpdate[i];

        //   // Update Existing Shopify Products
        //   const productTagsArray = await createProductTags(crwltkProduct[Object.keys(crwltkProduct)[0]]['akeneoObj']);
        //   productsSynced.productSyncData.push(crwltkProduct[Object.keys(crwltkProduct)[0]]['akeneoObj']['identifier']);
        //   productsSynced.shopifyProductResponse.push(await updateShopifyProduct(crwltkProduct, productTagsArray[0][crwltkProduct[Object.keys(crwltkProduct)[0]]['akeneoObj']['identifier']], process.env.CRAWLTEK_SECRET));
        // }

        // Create new products in Shopify
        for (let i = 0; i < crwltkProductsCreate.length; i ++) {
          let crwltkProduct = crwltkProductsCreate[i];
          productsSynced.productSyncData.push(crwltkProduct['identifier']);
          const productTagsArray = await createProductTags(crwltkProduct);
          let cloudinaryImages = {
            productImages: [],
            variantImages: [],
          };

          // Product Media
          if (crwltkProduct.values.product_media) {
            for (let j = 0; j < crwltkProduct.values.product_media[0].data.length; j ++) {
              let cloudinaryImageData = await getCloudinaryImageLink(crwltkProduct.values.product_media[0].data[j]);
              if (cloudinaryImageData.resources[0]) {
                cloudinaryImages.productImages.push(cloudinaryImageData.resources[0].secure_url);
              }
            }
          }

          // Variant Media
          if (crwltkProduct.values.variant_media) {
            for (let j = 0; j < crwltkProduct.values.variant_media[0].data.length; j ++) {
              let cloudinaryImageData = await getCloudinaryImageLink(crwltkProduct.values.variant_media[0].data[j]);
              if (cloudinaryImageData.resources[0]) {
                cloudinaryImages.variantImages.push(cloudinaryImageData.resources[0].secure_url);
              }
            }
          }

          // Create Shopify Product
          productsSynced.shopifyProductResponse.push(await createShopifyProduct(
            crwltkProduct,
            productTagsArray[0][crwltkProduct['identifier']],
            cloudinaryImages,
            process.env.CRAWLTEK_SECRET
          ));

          productsSynced.shopifyProductResponse.push(productTagsArray);
        }

        console.log("Products synced: ", productsSynced);

        // Resolves the promise
        resolve({ productNumber: productsSynced.productSyncData.length, productsSynced: productsSynced });
      }); // End of promise
    }

    getShopifyProductList();
  }); // End of promise
}

module.exports = {
  syncCrwltkProducts,
}