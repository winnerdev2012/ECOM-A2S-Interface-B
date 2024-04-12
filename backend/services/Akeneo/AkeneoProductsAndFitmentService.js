const { redisClient } = require("../../server");
const dotenv = require("dotenv");
dotenv.config();

// Zone models
const ZoneProduct = require("../../models/Zone/ZoneProduct");
// const ZoneFitmentString = require("../../models/Zone/ZoneFitmentString");
// JKS models
const JksProduct = require("../../models/Jks/JksProduct");
// const JksFitmentString = require("../../models/Jks/JksFitmentString");
// Misc models
const FitmentStringGeneral = require("../../models/Misc/FitmentStringGeneral");

// Traits
const { makeRequest } = require("../../traits/ConsumesExternalServices");

const getAkeneoProductsAndFitment = async (req) => {
  // Flush Redis
  await redisClient.flushallAsync();
  // Set up Promise for all logic
  return new Promise(async (resolve, reject) => {
    let dynamicEndpoint = "&limit=100";
    let akeneoCallCount = 0;

    async function getAkeneoProducts() {
      try {
        // Check Redis for products
        const redisKeys = await redisClient.keysAsync("akeneoProduct-*");
        if (redisKeys.length > 0 && akeneoCallCount === 0) {
          filterFitmentStringsAndProducts();
          return;
        } else {
          // If no products in Redis, call Akeneo
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
              "akeneoProduct-" + item.identifier,
              JSON.stringify(item)
            );
          }
          // Set next Akeneo page value for the next call
          let nextPageValue =
            resData._links.next === undefined
              ? "end"
              : resData._links.next.href;
          if (nextPageValue !== "end") {
            let urlArray = nextPageValue.split("?");
            dynamicEndpoint = urlArray[1];
          } else if (nextPageValue === "end") {
            dynamicEndpoint = nextPageValue;
          }
          akeneoCallCount++;
          checkAndCallAkeneo();
        }
      } catch (err) {
        console.log(err);
      }
    }

    async function filterFitmentStringsAndProducts() {
      console.log("Filtering fitment strings and products...")

      // Check Redis for fitment strings and final products
      const redisFitmentKeys = await redisClient.keysAsync("akeneoFitmentString-*");
      const redisFinalProductKeys = await redisClient.keysAsync("akeneoFinalProduct-*");

      // Delete all fitment strings and final products from Redis
      if (redisFitmentKeys.length > 0) {
        console.log("Deleting existing fitment strings from Redis...")
       for (let key of redisFitmentKeys) {
          await redisClient.delAsync(key);
       }
      }
      if (redisFinalProductKeys.length > 0) {
        console.log("Deleting existing final products from Redis...")
        for (let key of redisFinalProductKeys) {
          await redisClient.delAsync(key);
        }
      }


      // Check Redis for akeneoProducts
      const redisKeys = await redisClient.keysAsync("akeneoProduct-*");
      if (redisKeys.length > 0) {
        console.log("akeneoProducts found in Redis...")
        for (let key of redisKeys) {
          let product = await redisClient.getAsync(key);
          product = JSON.parse(product);
          if (product.values.zn_fitment) {
            // Add fitment strings to Redis
            await redisClient.setAsync("akeneoFitmentString-" + product.identifier, JSON.stringify({
                identifier: product.identifier,
                product_name: product.values.title[0].data ?? null,
                fitment_string_data: product.values.zn_fitment[0].data,
              })
            );

            // Check if product is sold on Zone or JKS
            if (product.values.sold_on_zone && product.values.sold_on_jks) {
              let store_id = 0;
              let store_name = "";
              if (product.values.sold_on_zone[0].data === true) {
                store_id = 1;
                store_name = "Zone";
              } else if (product.values.sold_on_jks[0].data === true) {
                store_id = 3;
                store_name = "JKS";
              }
              // Create final product object
              let finalProduct = {
                identifier: product.identifier,
                store_id: store_id,
                store_name: store_name,
              }
              // Add final products to Redis
              for (const key in product.values) {
                // Add product key and value to final product object
                finalProduct = {
                  ...finalProduct,
                  [key]: product.values[key] && product.values[key][0].data ? product.values[key][0].data : null,
                }                  
              }
              // Add final product to Redis
              await redisClient.setAsync("akeneoFinalProduct-" + product.identifier, JSON.stringify(finalProduct));
            }
          }
        }
      }
      // Remove all items from Redis with "akeneoProduct-" in the key
      const productsToDelete = await redisClient.keysAsync("akeneoProduct-*");
      for (let key of productsToDelete) {
        await redisClient.delAsync(key);
      }
      console.log("Fitment strings and products filtered...")
      console.log("akeneoProducts deleted from Redis...")

      // Save products to DB
      saveProductsToDb();
    }

    async function saveProductsToDb() {
      const zoneProducts = [];
      const jksProducts = [];
      console.log("Saving products to DB...")
      // Get products from Redis
      const productKeysFromRedis = await redisClient.keysAsync("akeneoFinalProduct-*");
      for (let i = 0; i < productKeysFromRedis.length; i++) {
        const product = await redisClient.getAsync(productKeysFromRedis[i]);
        const productObject = JSON.parse(product);
        switch (productObject.store_name) {
          case "Zone":
            const zoneProduct = new ZoneProduct({
              store_id: productObject.store_id,
              store_name: productObject.store_name,
              product_name: productObject.product_name,
              identifier: productObject.identifier,
              zn_finish: productObject.zn_finish,
              zn_liftType: productObject.zn_liftType,
              zn_material: productObject.zn_material,
              zn_wheelSize_1: productObject.zn_wheelSize_1,
              zn_wheelSize_2: productObject.zn_wheelSize_2,
              zn_wheelSize_3: productObject.zn_wheelSize_3,
              zn_backSpacing_1: productObject.zn_backSpacing_1,
              zn_backSpacing_2: productObject.zn_backSpacing_2,
              zn_backSpacing_3: productObject.zn_backSpacing_3,
              zn_maxTireSize_1: productObject.zn_maxTireSize_1,
              zn_maxTireSize_2: productObject.zn_maxTireSize_2,
              zn_maxTireSize_3: productObject.zn_maxTireSize_3,
              zn_liftHeight_rear: productObject.zn_liftHeight_rear,
              zn_liftMethod_rear: productObject.zn_liftMethod_rear,
              zn_liftHeight_front: productObject.zn_liftHeight_front,
              zn_liftMethod_front: productObject.zn_liftMethod_front,
              zn_installation_time: productObject.zn_installation_time,
              PVG_InventoryCategory: productObject.PVG_InventoryCategory,
              PVG_Harmonization_Code: productObject.PVG_Harmonization_Code,
              zn_requiresFitment: productObject.zn_requiresFitment,
              zn_requiresWelding: productObject.zn_requiresWelding,
              zn_requiresMetalCutting: productObject.zn_requiresMetalCutting,
            });
            zoneProducts.push(zoneProduct);
            console.log(`${zoneProduct.identifier} saved to Zone DB...`)
            break;
          case "JKS":
            const jksProduct = new JksProduct({
              store_id: productObject.store_id,
              store_name: productObject.store_name,
              product_name: productObject.product_name,
              identifier: productObject.identifier,
              jks_product_type: productObject.jks_product_type,
              PVG_InventoryCategory: productObject.PVG_InventoryCategory,
              PVG_Harmonization_Code: productObject.PVG_Harmonization_Code,
              jks_door_number: productObject.jks_door_number,
              jks_jrating_tag: productObject.jks_jrating_tag,
              jks_lift_height: productObject.jks_lift_height,
              jks_Product_Type_II: productObject.jks_Product_Type_II,
              tire_specs: productObject.tire_specs,
            });
            jksProducts.push(jksProduct);
            console.log(`${productObject.identifier} saved to JKS DB...`)
            break;
          default:
            break;
        }
      }
      await ZoneProduct.create(zoneProducts);
      await JksProduct.create(jksProducts);
      // Delete products from memory
      zoneProducts.length = 0;
      jksProducts.length = 0;
      console.log("Products saved to DB...")
      saveFitmentStringsToDb();
    }

    async function saveFitmentStringsToDb() {
      const fitmentStrings = [];
      console.log("Saving fitment strings to DB...")
      const fitmentStringKeysFromRedis = await redisClient.keysAsync("akeneoFitmentString-*");
      for (let i = 0; i < fitmentStringKeysFromRedis.length; i++) {
        const fitmentString = await redisClient.getAsync(fitmentStringKeysFromRedis[i]);
        const fitmentStringObject = JSON.parse(fitmentString);
        // Save fitment string to DB
        const fitmentStringGeneral = new FitmentStringGeneral({
          identifier: fitmentStringObject.identifier,
          product_name: fitmentStringObject.product_name,
          fitment_string_data: fitmentStringObject.fitment_string_data,
        });
        fitmentStrings.push(fitmentStringGeneral);
        console.log(`${fitmentStringObject.identifier} saved to Fitment DB...`)
      }
      await FitmentStringGeneral.create(fitmentStrings);
      // Delete fitment strings from memory
      console.log("Fitment strings saved to DB...")
      // Resolves promise
      console.log("Products and fitment strings saved to MongoDB! Done!")
      resolve({ message: "Products and fitment strings saved to MongoDB!" });
    }

    // Check to see if we are at the end of products
    function checkAndCallAkeneo() {
      if (dynamicEndpoint !== "end") {
        getAkeneoProducts(dynamicEndpoint);
      } else {
        filterFitmentStringsAndProducts();
      }
    }
    getAkeneoProducts(dynamicEndpoint);

    
  });
};

module.exports = {
  getAkeneoProductsAndFitment,
};
