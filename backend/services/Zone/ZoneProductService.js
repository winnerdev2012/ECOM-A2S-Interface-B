const axios = require('axios');
const makeGraphQlRequest = require('../../traits/graphql/MakesGraphQlRequest');
const { makeRequest } = require('../../traits/ConsumesExternalServices');
const dotenv = require('dotenv')
dotenv.config();
const Constants = require('../../traits/graphql/schema/Akeneo/Constants');
const { updateShopifyProduct, createShopifyProduct } = require('../../traits/graphql/schema/Zone/ZoneProductRequests');
const { updateShopifyProductMetafields, createShopifyProductMetafields } = require('./ZoneMetafieldUpdateService');
const { createProductTags } = require('./ZoneTagsService');
const { redisClient } = require('../../server');
const { processAsset, getCloudinaryImageLink } = require('./CloudinaryImageService');
const ZnCloudinaryUrl = require('../../models/Zone/ZoneCloudinaryUrls');

function syncZoneProducts(req, res) {
  return new Promise(async (resolve, reject) => {

    let shopifyProductList = [];
    let zoneProductsUpdate = [];
    let zoneProductsCreate = [];
    let currentCursor = null;
    let availableRateLimit = 800;
    let rateLimitThreshold = 100;
    let akeneoCallCount = 0;
    let dynamicEndpoint = '&limit=100';

    // Find products in Redis, and clear of all Zone products and Shopify products
    const redisZoneKeys = await redisClient.keysAsync("zoneSyncProducts-*");
    const redisShopifyKeys = await redisClient.keysAsync("zoneShopifyProducts-*");
    if (redisZoneKeys.length > 0) {
      await redisClient.delAsync(redisZoneKeys);
    }
    if (redisShopifyKeys.length > 0) {
      await redisClient.delAsync(redisShopifyKeys);
    }

    async function getShopifyProductList() {
      let response = null;
      let query = !currentCursor ? Constants.GET_SHOPIFY_PRODUCTS() : Constants.GET_SHOPIFY_PRODUCTS_WITH_CURSOR(currentCursor);

      if (availableRateLimit >= rateLimitThreshold) {
        console.log("Available Rate Limit, console1 : " + availableRateLimit)
        response = await makeGraphQlRequest(process.env.ZONE_OFFROAD_GRAPHQL_URI, query, process.env.ZONE_OFFROAD_SECRET, null, false);
        console.log("This is the current cursor: ", currentCursor)
        console.log("This the query: ", query)
        console.log("This is the response before the available rate limit: ", response)
        availableRateLimit = response.extensions.cost.throttleStatus.currentlyAvailable;
      } else {
        setTimeout(async () => {
          console.log("Available Rate Limit, console2 : " + availableRateLimit)
          response = await makeGraphQlRequest(process.env.ZONE_OFFROAD_GRAPHQL_URI, query, process.env.ZONE_OFFROAD_SECRET, null, false);
          availableRateLimit = response.extensions.cost.throttleStatus.currentlyAvailable;
        }, 6000);
      }

      let resProductArray = [];

      resProductArray.push(response.data.products);

      currentCursor = resProductArray[0].edges.length < 30 ? 'end' : resProductArray[0].edges[29].cursor;

      for (let i = 0; i < resProductArray[0].edges.length; i++) {
        let product = resProductArray[0].edges[i];
        // Set Shopify product data in Redis
        await redisClient.setAsync("zoneShopifyProducts-" + product.node.variants.edges[0].node.sku, JSON.stringify(product));
        shopifyProductList.push(product);
      }

      checkAndCallShopify();
    };

    async function getAkeneoProducts() {
      try {
        // Call Akeneo
        let resData = await makeRequest(
          "GET",
          `${process.env.AKENEO_API_URI}products?` + dynamicEndpoint,
          null,
          null,
          null
        );
        let items = resData._embedded.items;
        console.log(`${items.length} products retrieved from Akeneo on call count ${akeneoCallCount}.`)
        for (let item of items) {
          // Set general product data in Redis
          await redisClient.setAsync(
            "zoneSyncProducts-" + item.identifier,
            JSON.stringify(item)
          );
        }
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

    function checkAndCallShopify() {
      if (currentCursor !== 'end') {
        getShopifyProductList();
      } else {
        getAkeneoProducts(dynamicEndpoint);
      }
    }

    async function checkAndCallAkeneo() {
      if (dynamicEndpoint !== 'end') {
        getAkeneoProducts(dynamicEndpoint);
      } else {
        const productsSynced = await handleProductSync();
        // Resolves the promise
        resolve({
          statusCode: 200,
          body: {
            message: 'Synced products!',
            shopifyProducts: productsSynced
          },
        })
      }
    }

    async function refreshCloudinaryMongoLinks() {
      for (let i = 0; i < zoneProductsJson.length; i++) {
        const zoneProduct = zoneProductsJson[i];
        // Mongo Cloudinary Data
        let cloudinaryImages = {
          productImages: [],
          variantImages: [],
        };
        // Get Cloudinary image
        if (zoneProduct.values.PVG_Publish && zoneProduct.values.PVG_Publish[0].data.includes("PVG_ZON") || zoneProduct.values.PVG_Publish && zoneProduct.values.PVG_Publish[0].data.includes("PVG_BDS")) {
          if (!zoneProduct.values.variant_media && !zoneProduct.values.product_media) {
            const productImageObj = {
              productSku: zoneProduct.identifier,
              cloudinaryUrls: "None",
            }
            productsSynced.cloudinarySyncedData.push(productImageObj);
          } else if (zoneProduct.values.variant_media || zoneProduct.values.product_media) {
            if (zoneProduct.values.variant_media) {
              const productImageObj = {
                productSku: zoneProduct.identifier,
                cloudinaryUrls: [],
              }
              for (let j = 0; j < zoneProduct.values.variant_media[0].data.length; j++) {
                let cloudinaryImageData = await getCloudinaryImageLink(zoneProduct.values.variant_media[0].data[j]);
                // Write to Redis
                const redisKey = `cloudinaryImageData-${zoneProduct.identifier}`;
                await redisClient.setAsync(redisKey, JSON.stringify(cloudinaryImageData));
                // Push to cloudinaryUrls array
                productImageObj.cloudinaryUrls.push(cloudinaryImageData.resources);
                // Loop through cloudinaryImageData.resources and push to cloudinaryImages.productImages
                for (let k = 0; k < cloudinaryImageData.resources.length; k++) {
                  cloudinaryImages.variantImages.push(cloudinaryImageData.resources[k]);
                }
              }
            } else if (zoneProduct.values.product_media) {
              const productImageObj = {
                productSku: zoneProduct.identifier,
                cloudinaryUrls: [],
              }
              for (let j = 0; j < zoneProduct.values.product_media[0].data.length; j++) {
                let cloudinaryImageData = await getCloudinaryImageLink(zoneProduct.values.product_media[0].data[j]);
                // Write to Redis
                const redisKey = `cloudinaryImageData-${zoneProduct.identifier}`;
                await redisClient.setAsync(redisKey + '_' + zoneProduct.values.product_media[0].data[j], JSON.stringify(cloudinaryImageData));
                // Push to cloudinaryUrls array
                productImageObj.cloudinaryUrls.push(cloudinaryImageData.resources);
                // Loop through cloudinaryImageData.resources and push to cloudinaryImages.productImages
                for (let k = 0; k < cloudinaryImageData.resources.length; k++) {
                  cloudinaryImages.productImages.push(cloudinaryImageData.resources[k]);
                }
              }
            }

            // Push Cloudinary Data to Mongo
            const cloudinaryData = {
              identifier: zoneProduct.identifier,
              cloudinary_urls: cloudinaryImages,
            }
            await ZnCloudinaryUrl.create(cloudinaryData);


            const productImageObj = {
              productSku: zoneProduct.identifier,
              cloudinaryUrl: cloudinaryImageData.resources,
            }
            productsSynced.cloudinaryImageUrls.push(productImageObj);
          }
        }
      }
    }

    async function handleProductSync() {
      console.log("Handle sync called...")
      return new Promise(async (resolve, reject) => {
        let productsSynced = {
          productSyncData: [],
          shopifyProductResponse: [],
          cloudinaryImageUrls: [],
        };
        // Get all products from Redis
        const redisZoneKeys = await redisClient.keysAsync("zoneSyncProducts-*");
        let redisZoneProducts = [];
        if (redisZoneKeys.length > 0) {
          redisZoneProducts = await redisClient.mgetAsync(redisZoneKeys);
        }

        // Get all Akeneo products from Redis
        const redisAkeneoKeys = await redisClient.keysAsync("akeneoFinalProduct-*");
        let redisAkeneoProducts = [];
        if (redisAkeneoKeys.length > 0) {
          redisAkeneoProducts = await redisClient.mgetAsync(redisAkeneoKeys);
        }
        // Get all Shopify products from Redis
        const redisShopifyKeys = await redisClient.keysAsync("zoneShopifyProducts-*");
        let redisShopifyProducts = [];
        if (redisShopifyKeys.length > 0) {
          redisShopifyProducts = await redisClient.mgetAsync(redisShopifyKeys);
        }

        // Parse all Zone Akeneo products from Redis
        let zoneProductsParsed = [];
        redisZoneProducts.forEach((product) => {
          zoneProductsParsed.push(JSON.parse(product));
        });
        // Parse all Shopify products from Redis
        redisShopifyProducts.forEach((product) => {
          shopifyProductList.push(JSON.parse(product));
        });


        for (let i = 0; i < zoneProductsParsed.length; i++) {
          let newProductObj = {}
          let akeneoProduct = zoneProductsParsed[i];
          let akeneoKey = i;

          newProductObj[akeneoProduct.identifier] = {
            shopifyId: null,
            akeneoObj: null,
          }
          let productExists = false;

          for (let j = 0; j < shopifyProductList.length; j++) {
            let shopifyProduct = shopifyProductList[j];
            let shopifyKey = j;
            // console.log(akeneoProduct.identifier, zoneProductsUpdate[akeneoProduct.identifier])
            if (shopifyProduct && shopifyProduct.node.variants.edges[0].node.sku === akeneoProduct.identifier) {
              // Check for meta title and description
              let shopifyMetafields = {};
              let hasMetafields = false;
              if (shopifyProduct.node.metafields.edges.length > 0) {
                // console.log('Product has metafields')
                shopifyProduct.node.metafields.edges.forEach(edge => {
                  shopifyMetafields[edge.node.key] = edge.node;
                })
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
              zoneProductsUpdate.push(newProductObj);
              // Remove from shopify array
              shopifyProductList.splice(shopifyKey, 1);
              // Remove from akeneo array
              zoneProductsParsed.splice(akeneoKey, 1);
            }
          }
          // Create new product if not in store
          if (productExists === false && akeneoProduct.identifier.includes("ZON")) {
            if (akeneoProduct.values.PVG_Publish && akeneoProduct.values.PVG_Publish[0].data.includes("PVG_ZON")) {
              console.log("Product does not exist in Shopify: ", akeneoProduct.identifier)
              newProductObj[akeneoProduct.identifier]['akeneoObj'] = akeneoProduct;
              zoneProductsCreate.push(akeneoProduct);
            }
          }

        };

        // Sync filtered products to Shopify
        for (let i = 0; i < zoneProductsUpdate.length; i++) {
          let zoneProduct = zoneProductsUpdate[i];

          // Update Existing Shopify Products
          const productTagsArray = await createProductTags(zoneProduct[Object.keys(zoneProduct)[0]]['akeneoObj']);
          productsSynced.productSyncData.push(zoneProduct[Object.keys(zoneProduct)[0]]['akeneoObj']['identifier']);
          productsSynced.shopifyProductResponse.push(await updateShopifyProduct(zoneProduct, productTagsArray[0][zoneProduct[Object.keys(zoneProduct)[0]]['akeneoObj']['identifier']], process.env.ZONE_OFFROAD_SECRET));

          // Test Cloudinary Image Service Only
          // Get product data from Redis
          // const redisZoneKey2301 = await redisClient.keysAsync("zoneSyncProducts-ZOND2301"); 
          // const zoneProduct2301 = await redisClient.getAsync(redisZoneKey2301);
          // const zoneProduct2301JSON = JSON.parse(zoneProduct2301);

          // Get Cloudinary image
          // if(!zoneProduct[Object.keys(zoneProduct)[0]]['akeneoObj'].values.product_media) {
          //     const productImageObj = {
          //         productSku: zoneProduct[Object.keys(zoneProduct)[0]]['akeneoObj'].identifier,
          //         productMedia: zoneProduct[Object.keys(zoneProduct)[0]]['akeneoObj'].values.product_media,
          //         cloudinaryUrl: "None",
          //     }
          //     productsSynced.cloudinaryImageUrls.push(productImageObj);
          // } else if(zoneProduct[Object.keys(zoneProduct)[0]]['akeneoObj'].values.product_media) {
          //     let cloudinaryImageData = await getCloudinaryImageLink(zoneProduct[Object.keys(zoneProduct)[0]]['akeneoObj'].values.product_media[0].data[0]);
          //     const productImageObj = {
          //         productSku: zoneProduct[Object.keys(zoneProduct)[0]]['akeneoObj'].identifier,
          //         cloudinaryUrl: cloudinaryImageData.resources,
          //     }
          //     productsSynced.cloudinaryImageUrls.push(productImageObj);
          // }

          // let firstObject = zoneProduct[Object.keys(zoneProduct)[0]];
          // if (firstObject['hasMetafields']) {
          //     await updateShopifyProductMetafields(zoneProduct);
          // } 
        }

        // Create new products in Shopify
        for (let i = 0; i < zoneProductsCreate.length; i++) {
          let zoneProduct = zoneProductsCreate[i];
          productsSynced.productSyncData.push(zoneProduct['identifier']);
          const productTagsArray = await createProductTags(zoneProduct);
          let cloudinaryImages = {
            productImages: [],
            variantImages: [],
          };
          // Get Cloudinary Images

          // Redis Cloudinary Image Service
          // const redisCloudinaryKey = await redisClient.keysAsync(`cloudinaryMongoData-${zoneProduct.identifier}`);
          // const cloudinaryMongoData = await redisClient.mgetAsync(redisCloudinaryKey);
          // const cloudinaryMongoDataJson = JSON.parse(cloudinaryMongoData);
          // const cloudinaryProductImages = cloudinaryMongoDataJson.cloudinary_urls.productImages;
          // const cloudinaryVariantImages = cloudinaryMongoDataJson.cloudinary_urls.variantImages;

          // // Extract Secure URLs
          // for(let i = 0; i < cloudinaryProductImages.length; i++) {
          //     cloudinaryImages.productImages.push(cloudinaryProductImages[i].secure_url);
          // }
          // for(let i = 0; i < cloudinaryVariantImages.length; i++) {
          //     cloudinaryImages.variantImages.push(cloudinaryVariantImages[i].secure_url);
          // }


          // Product Media
          if (zoneProduct.values.product_media) {
            for (let j = 0; j < zoneProduct.values.product_media[0].data.length; j++) {
              let cloudinaryImageData = await getCloudinaryImageLink(zoneProduct.values.product_media[0].data[j]);
              if (cloudinaryImageData.resources[0]) {
                cloudinaryImages.productImages.push(cloudinaryImageData.resources[0].secure_url);
              }
            }
          }
          // Variant Media
          if (zoneProduct.values.variant_media) {
            for (let j = 0; j < zoneProduct.values.variant_media[0].data.length; j++) {
              let cloudinaryImageData = await getCloudinaryImageLink(zoneProduct.values.variant_media[0].data[j]);
              if (cloudinaryImageData.resources[0]) {
                cloudinaryImages.variantImages.push(cloudinaryImageData.resources[0].secure_url);
              }
            }
          }

          // Create Shopify Product
          productsSynced.shopifyProductResponse
            .push(await createShopifyProduct(
              zoneProduct,
              productTagsArray[0][zoneProduct['identifier']],
              cloudinaryImages,
              process.env.ZONE_OFFROAD_SECRET)
            )
          productsSynced.shopifyProductResponse.push(productTagsArray)
        }
        console.log("Products synced: ", productsSynced)


        // Resolves the promise
        resolve({ productNumber: productsSynced.productSyncData.length, productsSynced: productsSynced })

      }) // End of promise
    }

    getShopifyProductList();

  }) // End of promise
}

module.exports = {
  syncZoneProducts,
}