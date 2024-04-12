const dotenv = require('dotenv');
dotenv.config();
const axios = require('axios');
const { makeRequest } = require('../../traits/ConsumesExternalServices');
const { createProductTags } = require('./CrwltkTagsService');
const { getCloudinaryImageLink } = require('./CloudinaryImageService');
const { createShopifyVariantProduct } = require('../../traits/graphql/schema/Crwltk/CrwltkProductRequests');

function syncCrwltkVarients(req) {
  return new Promise(async (resolve) => {
    let productModels = [];
    let variants = ['CWLFB19001_CWLFB19011', 'CWLFB22101_CWLFB22141_CWLFB22131', 'CWLFB12101_CWLFB12111_CWLFB12121_CWLFB12131'];

    async function getAkeneoProductModels() {
      let nextUrl = `${process.env.AKENEO_API_URI}product-models?search={"family":[{"operator":"IN","value":["pcdb_skid_plate"]}]}&limit=100`;
      do {
        const resData = await makeRequest("GET", nextUrl, null, null, null);
        console.log(resData._links.self.href);
        productModels = productModels.concat(resData._embedded.items.filter(i => i.parent === null));
        nextUrl = resData._links?.next?.href;
      } while (nextUrl);

      nextUrl = `${process.env.AKENEO_API_URI}product-models?search={"family":[{"operator":"IN","value":["PVG_Bumpers"]}]}&limit=100`;

      do {
        const resData = await makeRequest("GET", nextUrl, null, null, null);
        console.log(resData._links.self.href);
        productModels = productModels.concat(resData._embedded.items.filter(i => i.parent === null));
        nextUrl = resData._links?.next?.href;
      } while (nextUrl);

      await getVariants();
    }

    async function getVariants() {
      const shopifyProducts = [];
      if (productModels.length > 0) {
        await Promise.all(productModels.filter(m => variants.some(i => i === m.code)).map(async (item) => {
          let newProductObj = {product: item, variants: []};
          let cloudinaryImages = {productImages: [], variantImages: []};

          const resData = await makeRequest('GET', `${process.env.AKENEO_API_URI}products?search={"parent":[{"operator":"=","value":"${item.code}"}]}&limit=100`, null, null, null);
          resData._embedded.items.map(v => {
            if (v.enabled) {
              newProductObj.variants.push(v);
            }
          });

          const productTagsArray = await createProductTags(newProductObj.variants.filter(v => v.identifier === item.code.split('_')[0])[0]);

          if (newProductObj.product.values.product_media) {
            for (let j = 0; j < newProductObj.product.values.product_media[0].data.length; j ++) {
              let cloudinaryImageData = await getCloudinaryImageLink(newProductObj.product.values.product_media[0].data[j]);
              if (cloudinaryImageData.resources[0]) {
                cloudinaryImages.productImages.push(cloudinaryImageData.resources[0].secure_url);
              }
            }
          }

          newProductObj.variants.map(async variant => {
            if (variant.values.variant_media) {
              for (let j = 0; j < variant.values.variant_media[0].data.length; j ++) {
                let cloudinaryImageData = await getCloudinaryImageLink(variant.values.variant_media[0].data[j]);
                if (cloudinaryImageData.resources[0]) {
                  cloudinaryImages.variantImages.push(cloudinaryImageData.resources[0].secure_url);
                }
              }
            }
          });

          await createShopifyVariantProduct(newProductObj, productTagsArray[0][newProductObj.variants.filter(v => v.identifier === item.code.split('_')[0])[0]['identifier']], cloudinaryImages, process.env.CRAWLTEK_SECRET);

          shopifyProducts.push(newProductObj);
        }));
      }

      resolve({
        statusCode: 200, body: { message: 'product models synced!', shopifyProducts: shopifyProducts }
      });
    }

    getAkeneoProductModels();

  }); // End of promise
}

module.exports = {
  syncCrwltkVarients,
}