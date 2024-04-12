const dotenv = require('dotenv');
dotenv.config();
const { makeRequest } = require('../../traits/ConsumesExternalServices');
const makeGraphQlRequest = require('../../traits/graphql/MakesGraphQlRequest');
const { createProductModelTags } = require('./BdsTagsService');
const { getCloudinaryImageLink, processAsset } = require('./CloudinaryImageService');
const Constants = require('../../traits/graphql/schema/Akeneo/Constants');
const { createShopifyVariantProduct, updateShopifyProduct } = require('../../traits/graphql/schema/Bds/BdsProductRequests');

async function syncBdsVarients(req) {
  return new Promise(async (resolve) => {
    let shopifyProductList = [];
    let productModels = [];

    async function getShopifyProductList() {
      let query = Constants.GET_SHOPIFY_PRODUCTS();
      do {
        const response = await makeGraphQlRequest(process.env.BDS_SUSPENSION_GRAPHQL_URI, query, process.env.BDS_SUSPENSION_SECRET, null, false);
        query = response.data.products.edges.length < 30? null : Constants.GET_SHOPIFY_PRODUCTS_WITH_CURSOR(response.data.products.edges[29].cursor);
        shopifyProductList = shopifyProductList.concat(response.data.products.edges);
      } while (query);

      getAkeneoProductModels();
    };

    async function getAkeneoProductModels() {
      let nextUrl = `${process.env.AKENEO_API_URI}product-models?search={"family":[{"operator":"IN","value":["PVG_BDS_18833_Suspension_Lift_Kit"]}]}&limit=100`;
      do {
        const resData = await makeRequest("GET", nextUrl, null, null, null);
        console.log(resData._links.self.href);
        productModels = productModels.concat(resData._embedded.items.filter(i => i.parent === null));
        nextUrl = resData._links?.next?.href;
      } while (nextUrl);

      nextUrl = `${process.env.AKENEO_API_URI}product-models?search={"family":[{"operator":"IN","value":["bds_shock_absorber_conversion_kit_13000"]}]}&limit=100`;

      do {
        const resData = await makeRequest("GET", nextUrl, null, null, null);
        console.log(resData._links.self.href);
        productModels = productModels.concat(resData._embedded.items.filter(i => i.parent === null));
        nextUrl = resData._links?.next?.href;
      } while (nextUrl);

      nextUrl = `${process.env.AKENEO_API_URI}product-models?search={"family":[{"operator":"IN","value":["zn_merch_apparel"]}]}&limit=100`;

      do {
        const resData = await makeRequest("GET", nextUrl, null, null, null);
        console.log(resData._links.self.href);
        productModels = productModels.concat(resData._embedded.items.filter(i => i.parent === null && i.categories.includes('BDS_productCategories') && !i.categories.includes('PVGBDS_Load_Sheet_Only') && i.values.PVG_Publish && i.values.PVG_Publish[0].data.includes('PVG_BDS')));
        nextUrl = resData._links?.next?.href;
      } while (nextUrl);

      await getVariants();
    }

    async function getVariants() {
      let shopifyProducts = [];
      if (productModels.length > 0) {
        let index = 0;
        for (const item of productModels) {
          index ++;
          let newProductObj = { product: item, variants: [] };
          let cloudinaryImages = { productImages: [], variantImages: [] };

          const resData = await makeRequest('GET', `${process.env.AKENEO_API_URI}products?search={"parent":[{"operator":"=","value":"${item.code}"}]}&limit=100`, null, null, null);
          newProductObj.variants = resData._embedded.items.filter(v => v.enabled);
          
          const productTagsArray = await createProductModelTags(newProductObj.product, newProductObj.variants);

          if (newProductObj.product.values.product_media) {
            for (const productImg of newProductObj.product.values.product_media[0].data) {
              let cloudinaryImageData = await getCloudinaryImageLink(productImg);
              if (cloudinaryImageData.resources[0]) {
                cloudinaryImages.productImages.push(cloudinaryImageData.resources[0].secure_url);
              }
            };
            // for (const productImg of newProductObj.product.values.product_media[0].data) {
            //   let cloudinaryImageData = await processAsset(productImg);
            //   if (cloudinaryImageData) {
            //     cloudinaryImages.productImages.push(cloudinaryImageData);
            //   }
            // };
          }

          for (const variant of newProductObj.variants) {
            let imgs = [];
            if (variant.values.variant_media) {
              for (const variantImg of variant.values.variant_media[0].data) {
                let cloudinaryImageData = await getCloudinaryImageLink(variantImg);
                if (cloudinaryImageData.resources[0]) {
                  imgs.push(cloudinaryImageData.resources[0].secure_url);
                }
              }
              // for (const variantImg of variant.values.variant_media[0].data) {
              //   let cloudinaryImageData = await processAsset(variantImg);
              //   if (cloudinaryImageData) {
              //     imgs.push(cloudinaryImageData);
              //   }
              // }
            }
            cloudinaryImages.variantImages.push({ sku: variant.identifier, images: imgs});
          }

          console.log(productTagsArray);

          const shopifyfilteredProduct = shopifyProductList.filter(p => newProductObj.variants.filter(v => v.identifier === p.node.variants.edges[0].node.sku).length > 0);

          if (shopifyfilteredProduct.length === 0) {
            await createShopifyVariantProduct(newProductObj, productTagsArray[0][newProductObj.product.code], cloudinaryImages, process.env.BDS_SUSPENSION_SECRET);

            shopifyProducts.push(newProductObj);
            console.log('Created product : ', index, newProductObj.product.code, newProductObj.variants.length);
          } else {
            await updateShopifyProduct(shopifyfilteredProduct[0], newProductObj.product, productTagsArray[0][newProductObj.product.code], cloudinaryImages, process.env.BDS_SUSPENSION_SECRET);

            shopifyProducts.push(newProductObj);
            console.log('Updated Product : ', index, newProductObj.product.code, newProductObj.variants.length);
          }
        };
      }

      resolve({
        statusCode: 200, body: { message: 'product models synced!', shopifyProducts: shopifyProducts, count: shopifyProducts.length }
      });
    }

    getShopifyProductList();
  });
}

module.exports = {
  syncBdsVarients
}