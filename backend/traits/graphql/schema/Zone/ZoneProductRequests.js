const { graphql, buildSchema } = require('graphql');
const makeGraphQlRequest = require('../../MakesGraphQlRequest');
const dotenv = require('dotenv');
dotenv.config();

const schema = buildSchema(`
  type Metafield {
    id: ID
    namespace: String
    key: String
    value: String
  }

  type Product {
    title: String
    descriptionHtml: String
    metafields: [Metafield]
  }

  input ProductInput {
    id: ID
    title: String
    descriptionHtml: String
    metafields: [MetafieldInput]
  }

  input MetafieldInput {
    namespace: String
    key: String
    value: String
    type: String
  }

  type Mutation {
    productUpdate(input: ProductInput): Product
  }
`);

const updateShopifyProduct = async (productObj, tagsArray, accessToken) => {
  return new Promise(async (resolve, reject) => {
    const innerObj = productObj[Object.keys(productObj)[0]];
    console.log("Updating: ", innerObj.akeneoObj.identifier)
    const variables = {
      input: {
        id: innerObj.shopifyId,
        title: innerObj.akeneoObj.values.title ? innerObj.akeneoObj.values.title[0].data : 'No Title Available',
        descriptionHtml: innerObj.akeneoObj.values.description_body ? innerObj.akeneoObj.values.description_body[0].data : 'No Description Available',
        tags: tagsArray
      }
    };

    // if (innerObj.shopifyMetafields) {
    //   console.log("Yes, there are metafields...")
    //   variables.input['metafields'] = [];
    //   // Add or update metafields

    //   // Product Meta Title
    //   if (innerObj.akeneoObj.values.title_tag) {
    //     variables.input.metafields.push({
    //       id: innerObj.shopifyMetafields.title_tag ? innerObj.shopifyMetafields.title_tag.id : null,  
    //       namespace: 'global',
    //       key: 'title_tag',
    //       value: innerObj.akeneoObj.values.title_tag[0].data || 'No Title Available',
    //       type: 'single_line_text_field'
    //     })
    //   }
    //   // Product Meta Description
    //   if (innerObj.akeneoObj.values.description_tag) {
    //     variables.input.metafields.push({
    //       id: innerObj.shopifyMetafields.description_tag ? innerObj.shopifyMetafields.description_tag.id : null,
    //       namespace: 'global',
    //       key: 'description_tag',
    //       value: innerObj.akeneoObj.values.description_tag[0].data || 'No Description Available',
    //       type: 'single_line_text_field'
    //     })
    //   }
    //   // Fitment Details
    //   if (innerObj.akeneoObj.values.zn_fitment) {
    //     variables.input.metafields.push({
    //       id: innerObj.shopifyMetafields.fitment_details ? innerObj.shopifyMetafields.fitment_details.id : null,
    //       namespace: 'pim',
    //       key: 'fitment_details',
    //       value: JSON.stringify(innerObj.akeneoObj.values.zn_fitment[0].data) || 'No Fitment Available',
    //       type: 'single_line_text_field'
    //     })
    //   }
    //   // Features
    //   if (innerObj.akeneoObj.values.zn_features) {
    //     variables.input.metafields.push({
    //       id: innerObj.shopifyMetafields.zn_features ? innerObj.shopifyMetafields.zn_features.id : null,
    //       namespace: 'pim',
    //       key: 'zn_features',
    //       value: JSON.stringify(innerObj.akeneoObj.values.zn_features[0].data) || 'No Features Available',
    //       type: 'single_line_text_field'
    //     })
    //   }
    //   // Shipping Dimensions
    //   if (innerObj.akeneoObj.values.box_width && innerObj.akeneoObj.values.box_height && innerObj.akeneoObj.values.box_length) {
    //     variables.input.metafields.push({
    //       id: innerObj.shopifyMetafields.zn_shipping_dimensions ? innerObj.shopifyMetafields.zn_shipping_dimensions.id : null,
    //       namespace: 'pim',
    //       key: 'shipping_dimensions',
    //       value: JSON.stringify({
    //         width: Number(innerObj.akeneoObj.values.box_width[0].data.amount).toFixed(2).toString(),
    //         height: Number(innerObj.akeneoObj.values.box_height[0].data.amount).toFixed(2).toString(),
    //         length: Number(innerObj.akeneoObj.values.box_length[0].data.amount).toFixed(2).toString()
    //       }),
    //       type: 'single_line_text_field'
    //     })
    //   }
    //   // Country of Origin
    //   if (innerObj.akeneoObj.values.Fox_COO) { 
    //     variables.input.metafields.push({
    //       id: innerObj.shopifyMetafields.country_of_origin ? innerObj.shopifyMetafields.country_of_origin.id : null,
    //       namespace: 'pim',
    //       key: 'zn_coo',
    //       value: innerObj.akeneoObj.values.Fox_COO[0].data,
    //       type: 'single_line_text_field'
    //     })
    //   }
    //   // Box Items
    //   if (innerObj.akeneoObj.values.zn_boxItems) {
    //     variables.input.metafields.push({
    //       id: innerObj.shopifyMetafields.zn_boxItems ? innerObj.shopifyMetafields.zn_boxItems.id : null,
    //       namespace: 'pim',
    //       key: 'zn_boxItems',
    //       value: JSON.stringify(innerObj.akeneoObj.values.zn_boxItems[0].data),
    //       type: 'single_line_text_field'
    //     })
    //   }


    // }

    const mutation = `mutation productUpdate($input: ProductInput!) {
      productUpdate(input: $input) {
        product {
          title
          descriptionHtml
          tags
        }
        userErrors {
          field
          message
        }
      }
    }`;

    const productUpdated = await makeGraphQlRequest(process.env.ZONE_OFFROAD_GRAPHQL_URI, mutation, accessToken, variables, true);
    console.log("The product has been updated...")
    resolve(productUpdated);
  });
}

const createShopifyProduct = async (productObj, productTagsArray, cloudinaryImages, accessToken) => {
  return new Promise(async (resolve, reject) => {
    const variables = {
      input: {
        title: productObj.values.title ? productObj.values.title[0].data : 'No Title Available',
        descriptionHtml: productObj.values.description_body ? productObj.values.description_body[0].data : 'No Description Available',
        vendor: 'No Brand Available',
        tags: productTagsArray,
        images: [],
        customProductType: null,
        published: true,
        metafields: [],
        variants: [
          {
            title: productObj.values.title ? productObj.values.title[0].data : 'No Title Available',
            sku: productObj.identifier,
            price: productObj.values.price ? productObj.values.price[0].data[0].amount : '0.00',
            weight: productObj.values.weight ? Number(productObj.values.weight[0].data.amount) : 0.00,
            metafields: []
          }
        ]
      }
    };

    const mutation = `mutation productCreate($input: ProductInput!) {
      productCreate(input: $input) {
        product {
          title
          descriptionHtml
          tags
          vendor
          metafields(first: 100) {
            edges {
              node {
                namespace
                key
                value
              }
            }
          }
          images(first: 5) {
            edges {
              node {
                altText
                src
              }
            }
          }
          variants(first: 5) {
            edges {
              node {
                id
                title
                price
                sku
                weight
                metafields(first: 100) {
                  edges {
                    node {
                      namespace
                      key
                      value
                    }
                  }
                }
              }
            }
          }
        }
      }
    }`;

    // Change product fields dynamically

    // Product Vendor
    if (productObj.values.stusa_brand && productObj.values.stusa_brand[0].data === 'zoneOffroad') {
      variables.input.vendor = 'Zone Offroad';
    }
    // Fitment Details Metafields
    if (productObj.values.zn_fitment) {
      // Add Fitment Details to Product
      variables.input.metafields.push({
        namespace: 'pim',
        key: 'fitment_details',
        value: JSON.stringify(productObj.values.zn_fitment[0].data) || 'No Fitment Available',
        type: 'single_line_text_field'
      })
      variables.input.variants[0].metafields.push({
        namespace: 'pim',
        key: 'fitment_details',
        value: JSON.stringify(productObj.values.zn_fitment[0].data) || 'No Fitment Available',
        type: 'single_line_text_field'
      })
    }
    // Add Product Features Metafield
    if (productObj.values.zn_features) {
      variables.input.metafields.push({
        namespace: 'pim',
        key: 'product_features',
        value: JSON.stringify(productObj.values.zn_features[0].data) || 'No Product Features Available',
        type: 'single_line_text_field'
      })
      variables.input.variants[0].metafields.push({
        namespace: 'pim',
        key: 'product_features',
        value: JSON.stringify(productObj.values.zn_features[0].data) || 'No Product Features Available',
        type: 'single_line_text_field'
      })
    }
    // Add Meta Title and Meta Description if available, both pim and global on the product. Pim only on the variant.
    if (productObj.values.meta_title) {
      variables.input.metafields.push({
        namespace: 'pim',
        key: 'meta_title',
        value: productObj.values.meta_title[0].data || 'No Meta Title Available',
        type: 'single_line_text_field'
      },
        {
          namespace: 'global',
          key: 'title_tag',
          value: productObj.values.meta_title[0].data || 'No Meta Title Available',
          type: 'single_line_text_field'
        }
      )
      variables.input.variants[0].metafields.push({
        namespace: 'pim',
        key: 'meta_title',
        value: productObj.values.meta_title[0].data || 'No Meta Title Available',
        type: 'single_line_text_field'
      })
    }
    if (productObj.values.meta_description) {
      variables.input.metafields.push({
        namespace: 'pim',
        key: 'meta_description',
        value: productObj.values.meta_description[0].data || 'No Meta Description Available',
        type: 'single_line_text_field'
      },
        {
          namespace: 'global',
          key: 'description_tag',
          value: productObj.values.meta_description[0].data || 'No Meta Description Available',
          type: 'single_line_text_field'
        })
      variables.input.variants[0].metafields.push({
        namespace: 'pim',
        key: 'meta_description',
        value: productObj.values.meta_description[0].data || 'No Meta Description Available',
        type: 'single_line_text_field'
      })
    }
    // Add Product Images
    if (cloudinaryImages.productImages && cloudinaryImages.productImages.length > 0) {
      for (let i = 0; i < cloudinaryImages.productImages.length; i++) {
        variables.input.images.push({
          "altText": "",
          "src": cloudinaryImages.productImages[i]
        })
      }
    }
    // Product Type - Loop through tags and find any match for Kits, Parts, or Merchandise. If match, set product type to that.
    for (let i = 0; i < productTagsArray.length; i++) {
      if (productTagsArray[i] === 'Kits') {
        variables.input.customProductType = 'Kits';
        break;
      } else if (productTagsArray[i] === 'Parts') {
        variables.input.customProductType = 'Parts';
        break;
      } else if (productTagsArray[i] === 'Merchandise') {
        variables.input.customProductType = 'Merchandise';
        break;
      } else {
        variables.input.customProductType = 'Other';
      }
    }

    const productCreated = await makeGraphQlRequest(process.env.ZONE_OFFROAD_GRAPHQL_URI, mutation, accessToken, variables, true);
    console.log("The product was created...")
    resolve(productCreated);
  });
}

module.exports = {
  createShopifyProduct,
  updateShopifyProduct
};