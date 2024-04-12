const { makeRequest } = require('../../../ConsumesExternalServices');
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

    const productUpdated = await makeGraphQlRequest(process.env.CRAWLTEK_GRAPHQL_URI, mutation, accessToken, variables, true);
    console.log("The product has been updated...");
    resolve(productUpdated);
  });
}

const formatOption = (str) => {
  return str.toString().split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

const createShopifyProduct = async (productObj, productTagsArray, cloudinaryImages, accessToken) => {
  return new Promise(async (resolve) => {
    let tags = productTagsArray;
    const variables = {
      input: {
        title: productObj.values.title ? productObj.values.title[0].data : 'No Title Available',
        descriptionHtml: productObj.values.description_body ? productObj.values.description_body[0].data : 'No Description Available',
        vendor: 'No Brand Available',
        tags: tags,
        images: [],
        customProductType: null,
        published: true,
        metafields: [],
        options: [],
        variants: []
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
                barcode
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

    variables.input.variants.push(
      {
        title: productObj.values.title ? productObj.values.title[0].data : 'No Title Available',
        sku: productObj.identifier,
        price: productObj.values.price ? productObj.values.price[0].data[0].amount : '0.00',
        weight: productObj.values.weight ? Number(productObj.values.weight[0].data.amount) : 0.00,
        barcode: productObj.values.PVG_UPC ? Math.trunc(Number(productObj.values.PVG_UPC[0].data)).toString() : null,
        metafields: []
      }
    );
    // Change product fields dynamically
    // Product Vendor
    if (productObj.values.stusa_brand && productObj.values.stusa_brand[0].data === 'PVGcrwl') {
      variables.input.vendor = 'CrawlTek Revolution';
    }

    // Fitment Details Metafields
    if (productObj.values.zn_fitment) {
      // Add Fitment Details to Product
      variables.input.metafields.push({
        namespace: 'pim',
        key: 'fitment_details',
        value: productObj.values.zn_fitment[0].data.toString().replace(/"/g, '') || 'No Fitment Available',
        type: 'single_line_text_field'
      });
      variables.input.variants[0].metafields.push({
        namespace: 'pim',
        key: 'fitment_details',
        value: productObj.values.zn_fitment[0].data.toString().replace(/"/g, '') || 'No Fitment Available',
        type: 'single_line_text_field'
      });
    }
    if (productObj.values.zn_importantNotes) {
      // Add Fitment Details to Product
      variables.input.metafields.push({
        namespace: 'pim',
        key: 'important_notes',
        value: productObj.values.zn_importantNotes[0].data || 'No Important Note Available',
        type: 'multi_line_text_field'
      });
      variables.input.variants[0].metafields.push({
        namespace: 'pim',
        key: 'important_notes',
        value: productObj.values.zn_importantNotes[0].data || 'No Important Note Available',
        type: 'multi_line_text_field'
      });
    }
    if (productObj.values.zn_installation_instructions) {
      // Add Fitment Details to Product
      variables.input.metafields.push({
        namespace: 'pim',
        key: 'instructions',
        value: productObj.values.zn_installation_instructions[0].data.toString().replace(/"/g, '') || 'No Instiallation Instruction Available',
        type: 'url'
      });
      variables.input.variants[0].metafields.push({
        namespace: 'pim',
        key: 'instructions',
        value: productObj.values.zn_installation_instructions[0].data.toString().replace(/"/g, '') || 'No Instiallation Instruction Available',
        type: 'url'
      });
    }
    // Add Product Features Metafield
    if (productObj.values.zn_features) {
      variables.input.metafields.push({
        namespace: 'pim',
        key: 'product_features',
        value: productObj.values.zn_features[0].data || 'No Product Features Available',
        type: 'multi_line_text_field'
      });
      variables.input.variants[0].metafields.push({
        namespace: 'pim',
        key: 'product_features',
        value: productObj.values.zn_features[0].data || 'No Product Features Available',
        type: 'multi_line_text_field'
      });
    }

    // Add Meta Title and Meta Description if available, both pim and global on the product. Pim only on the variant.
    if (productObj.values.meta_title) {
      variables.input.metafields.push({
        namespace: 'pim',
        key: 'meta_title',
        value: productObj.values.meta_title[0].data.toString().replace(/"/g, '') || 'No Meta Title Available',
        type: 'single_line_text_field'
      },
      {
        namespace: 'global',
        key: 'title_tag',
        value: productObj.values.meta_title[0].data.toString().replace(/"/g, '') || 'No Meta Title Available',
        type: 'single_line_text_field'
      });
      variables.input.variants[0].metafields.push({
        namespace: 'pim',
        key: 'meta_title',
        value: productObj.values.meta_title[0].data.toString().replace(/"/g, '') || 'No Meta Title Available',
        type: 'single_line_text_field'
      })
    }
    if (productObj.values.meta_description) {
      variables.input.metafields.push({
        namespace: 'pim',
        key: 'meta_description',
        value: productObj.values.meta_description[0].data.toString().replace(/"/g, '') || 'No Meta Description Available',
        type: 'single_line_text_field'
      },
      {
        namespace: 'global',
        key: 'description_tag',
        value: productObj.values.meta_description[0].data.toString().replace(/"/g, '') || 'No Meta Description Available',
        type: 'single_line_text_field'
      });
      variables.input.variants[0].metafields.push({
        namespace: 'pim',
        key: 'meta_description',
        value: productObj.values.meta_description[0].data.toString().replace(/"/g, '') || 'No Meta Description Available',
        type: 'single_line_text_field'
      });
    }

    // Add Product Images
    if (cloudinaryImages.productImages && cloudinaryImages.productImages.length > 0) {
      for (let i = 0; i < cloudinaryImages.productImages.length; i ++) {
        variables.input.images.push({
          "altText": "",
          "src": cloudinaryImages.productImages[i]
        });
      }
    }

    // Product Type - Loop through tags and find any match for Kits, Parts, or Merchandise. If match, set product type to that.
    for (let i = 0; i < tags.length; i ++) {
      if (tags[i] === 'Kits') {
        variables.input.customProductType = 'Kits';
        break;
      } else if (tags[i] === 'Parts') {
        variables.input.customProductType = 'Parts';
        break;
      } else if (tags[i] === 'Merchandise') {
        variables.input.customProductType = 'Merchandise';
        break;
      } else {
        variables.input.customProductType = 'Other';
      }
    }

    // console.log(JSON.stringify(variables, null, 2));

    const productCreated = await makeGraphQlRequest(process.env.CRAWLTEK_GRAPHQL_URI, mutation, accessToken, variables, true);
    console.log("The product was created...");
    resolve(productCreated);
  });
}

const createShopifyVariantProduct = async (productObj, productTagsArray, cloudinaryImages, accessToken) => {
  return new Promise(async (resolve) => {
    const product = productObj.product;
    const variants = productObj.variants;
    let tags = productTagsArray;
    const variables = {
      input: {
        title: product.values.title ? product.values.title[0].data : 'No Title Available',
        descriptionHtml: product.values.description_body ? product.values.description_body[0].data : 'No Description Available',
        vendor: 'No Brand Available',
        tags: tags,
        images: [],
        customProductType: null,
        published: true,
        metafields: [],
        options: [],
        variants: []
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
                barcode
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

    if (product.code === 'CWLFB19001_CWLFB19011') {
      tags = ['Skid Plates', 'New', 'Ford', 'Bronco', 'Blaze', '2020-2022 Ford Bronco'];
      variables.input.tags = tags;
    } else if (product.code === 'CWLFB22101_CWLFB22141_CWLFB22131') {
      tags = ['Rear Bumper', 'New', 'Ford', 'Bronco', 'Blaze', '2020-2022 Ford Bronco'];
      variables.input.tags = tags;
    } else if (product.code === 'CWLFB12101_CWLFB12111_CWLFB12121_CWLFB12131') {
      tags = ['Front Bumper', 'New', 'Ford', 'Bronco', 'Blaze', '2020-2022 Ford Bronco'];
      variables.input.tags = tags;
    }

    const resData = await makeRequest('GET', `${process.env.AKENEO_API_URI}families/${product.family}/variants/${product.family_variant}`, null, null, null);
    const options = [];
    resData.variant_attribute_sets.map(attribute => {
      options.push(attribute.axes[0]);
    });

    options.map(option => {
      variables.input.options.push(formatOption(option));
    });
    
    // Product Vendor
    if (product.values.stusa_brand && product.values.stusa_brand[0].data === 'PVGcrwl') {
      variables.input.vendor = 'CrawlTek Revolution';
    }
  
    if (product.values.zn_fitment) {
      variables.input.metafields.push({
        namespace: 'pim',
        key: 'fitment_details',
        value: product.values.zn_fitment[0].data.toString().replace(/"/g, '') || 'No Fitment Available',
        type: 'single_line_text_field'
      });
    }
    if (product.values.zn_importantNotes) {
      variables.input.metafields.push({
        namespace: 'pim',
        key: 'important_notes',
        value: product.values.zn_importantNotes[0].data || 'No Important Note Available',
        type: 'multi_line_text_field'
      });
    }
    if (product.values.zn_installation_instructions) {
      variables.input.metafields.push({
        namespace: 'pim',
        key: 'instructions',
        value: product.values.zn_installation_instructions[0].data.toString().replace(/"/g, '') || 'No Instiallation Instruction Available',
        type: 'url'
      });
    }
    if (product.values.zn_features) {
      variables.input.metafields.push({
        namespace: 'pim',
        key: 'product_features',
        value: product.values.zn_features[0].data || 'No Product Features Available',
        type: 'multi_line_text_field'
      });
    }
    if (product.values.meta_title) {
      variables.input.metafields.push({
        namespace: 'pim',
        key: 'meta_title',
        value: product.values.meta_title[0].data.toString().replace(/"/g, '') || 'No Meta Title Available',
        type: 'single_line_text_field'
      })
    }
    if (product.values.meta_description) {
      variables.input.metafields.push({
        namespace: 'pim',
        key: 'meta_description',
        value: product.values.meta_description[0].data.toString().replace(/"/g, '') || 'No Meta Description Available',
        type: 'single_line_text_field'
      });
    }
    if (cloudinaryImages.productImages && cloudinaryImages.productImages.length > 0) {
      for (let i = 0; i < cloudinaryImages.productImages.length; i ++) {
        variables.input.images.push({
          "altText": "",
          "src": cloudinaryImages.productImages[i]
        });
      }
    }
  
    variants.map((variant, k) => {
      let eachVariant = {
        title: variant.values.title ? variant.values.title[0].data : 'No Title Available',
        sku: variant.identifier,
        options: [],
        position: k + 1,
        price: variant.values.price ? variant.values.price[0].data[0].amount : '0.00',
        weight: variant.values.weight ? Number(variant.values.weight[0].data.amount) : 0.00,
        barcode: variant.values.PVG_UPC ? Math.trunc(Number(variant.values.PVG_UPC[0].data)).toString() : null,
        metafields: []
      };
      
      if (variants.some(i => i.identifier === 'CWLFB19001')) {
        if (variant.values.winch_option) {
          eachVariant.options.push(formatOption(variant.values.winch_option[0].data));
        }
      }
      if (variants.some(i => i.identifier === 'CWLFB22101')) {
        if (variant.values.sensor_cutouts) {
          eachVariant.options.push(formatOption(variant.values.sensor_cutouts[0].data));
        }
        if (variant.values.light_cutouts) {
          eachVariant.options.push(formatOption(variant.values.light_cutouts[0].data));
        }
      }
      if (variants.some(i => i.identifier === 'CWLFB12101')) {
        if (variant.values.parking_sensors) {
          eachVariant.options.push(formatOption(variant.values.parking_sensors[0].data));
        }
        if (variant.values.radar_adaptive_cruise_control) {
          eachVariant.options.push(formatOption(variant.values.radar_adaptive_cruise_control[0].data));
        }
        if (variant.values.light_cutouts) {
          eachVariant.options.push(formatOption(variant.values.light_cutouts[0].data));
        }
      }
      variables.input.variants.push(eachVariant);
    });

    // Product Type - Loop through tags and find any match for Kits, Parts, or Merchandise. If match, set product type to that.
    for (let i = 0; i < tags.length; i ++) {
      if (tags[i] === 'Kits') {
        variables.input.customProductType = 'Kits';
        break;
      } else if (tags[i] === 'Parts') {
        variables.input.customProductType = 'Parts';
        break;
      } else if (tags[i] === 'Merchandise') {
        variables.input.customProductType = 'Merchandise';
        break;
      } else {
        variables.input.customProductType = 'Other';
      }
    }

    console.log(JSON.stringify(variables, null, 2));

    const productCreated = await makeGraphQlRequest(process.env.CRAWLTEK_GRAPHQL_URI, mutation, accessToken, variables, true);
    console.log("The product was created...");
    resolve(productCreated);
  });
}

module.exports = {
  createShopifyProduct,
  updateShopifyProduct,
  createShopifyVariantProduct
};