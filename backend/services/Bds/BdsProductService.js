const dotenv = require('dotenv');
dotenv.config();
const makeGraphQlRequest = require('../../traits/graphql/MakesGraphQlRequest');
const { makeRequest } = require('../../traits/ConsumesExternalServices');
const Constants = require('../../traits/graphql/schema/Akeneo/Constants');
const { updateShopifyProduct, createShopifyProduct } = require('../../traits/graphql/schema/Bds/BdsProductRequests');
const { createProductTags } = require('./BdsTagsService');
const { processAsset, getCloudinaryImageLink } = require('./CloudinaryImageService');

async function syncBdsProducts() {
  return new Promise(async (resolve) => {
    let shopifyProductList = [];
    let products = [];

    async function getShopifyProductList() {
      let query = Constants.GET_SHOPIFY_PRODUCTS();
      do {
        const response = await makeGraphQlRequest(process.env.BDS_SUSPENSION_GRAPHQL_URI, query, process.env.BDS_SUSPENSION_SECRET, null, false);
        query = response.data.products.edges.length < 30? null : Constants.GET_SHOPIFY_PRODUCTS_WITH_CURSOR(response.data.products.edges[29].cursor);
        shopifyProductList = shopifyProductList.concat(response.data.products.edges);
      } while (query);

      getAkeneoProducts();
    };

    async function getAkeneoProducts() {
      let nextUrl = `${process.env.AKENEO_API_URI}products?limit=100`;
      do {
        const resData = await makeRequest("GET", nextUrl, null, null, null);
        console.log(resData._links.self.href);
        products = products.concat(resData._embedded.items.filter(item => item.parent === null && item.enabled && item.categories.includes('BDS_productCategories') && !item.categories.includes('PVGBDS_Load_Sheet_Only') && item.values.PVG_Publish && item.values.PVG_Publish[0].data.includes('PVG_BDS')));
        nextUrl = resData._links?.next?.href;
      } while (nextUrl);

      const productsSynced = await handleProductSync();
      resolve({ statusCode: 200, body: { message: 'Synced products!', shopifyProducts: productsSynced } });
    }

    async function handleProductSync() {
      return new Promise(async (resolve) => {
        let syncedProducts = [];
        for (const product of products) {
          const tags = await createProductTags(product);
          const filteredProduct = shopifyProductList.filter(p => p.node.variants.edges[0].node.sku === product.identifier);
          let cloudinaryImages = { productImages: [], variantImages: []};

          if (product.values.product_media) {
            for (const productImg of product.values.product_media[0].data) {
              let cloudinaryImageData = await getCloudinaryImageLink(productImg);
              if (cloudinaryImageData.resources[0]) {
                cloudinaryImages.productImages.push(cloudinaryImageData.resources[0].secure_url);
              }
            }
          }

          if (product.values.variant_media) {
            for (const variantImg of product.values.variant_media[0].data) {
              let cloudinaryImageData = await getCloudinaryImageLink(variantImg);
              if (cloudinaryImageData.resources[0]) {
                cloudinaryImages.variantImages.push(cloudinaryImageData.resources[0].secure_url);
              }
            }
          }

          if (filteredProduct.length === 0) {
            await createShopifyProduct(product, tags[0][product.identifier], cloudinaryImages, process.env.BDS_SUSPENSION_SECRET);
          } else {
            await updateShopifyProduct(filteredProduct[0], product, tags[0][product.identifier], cloudinaryImages, process.env.BDS_SUSPENSION_SECRET);
          }

          syncedProducts.push(product);
        }

        // Resolves the promise
        resolve({ productNumber: syncedProducts.length, productsSynced: syncedProducts });
      });
    }

    getShopifyProductList();
  });
}

module.exports = {
  syncBdsProducts,
}