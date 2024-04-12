const dotenv = require('dotenv');
dotenv.config();
const { makeRequest } = require('../../../ConsumesExternalServices');
const makeGraphQlRequest = require('../../MakesGraphQlRequest');

const updateShopifyProduct = async (sProduct, productObj, tags, cloudinaryImages, accessToken) => {
  return new Promise(async (resolve) => {
    const variables = {
      input: {
        id: sProduct.node.id,
        title: productObj.values.title? productObj.values.title[0].data : 'No Title Available',
        descriptionHtml: productObj.values.SDC_MKT_Description_body? productObj.values.SDC_MKT_Description_body[0].data : 'No Description Available',
        vendor: 'No Brand Available',
        tags: tags,
        images: [],
        customProductType: null,
        published: true,
        metafields: [],
        variants: []
      }
    };

    const mutation = `mutation productUpdate($input: ProductInput!) {
      productUpdate(input: $input) {
        userErrors {
          field
          message
        }
        product {
          id
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

    if (productObj.values.stusa_brand && productObj.values.stusa_brand[0].data === 'bds') {
      variables.input.vendor = 'BDS Suspension';
    }

    // if (productObj.values.help_text_1) {
    //   variables.input.metafields.push({
    //     namespace: 'pim',
    //     key: 'help_text_1',
    //     value: productObj.values.help_text_1[0].data || 'No Help Text Available',
    //     type: 'multi_line_text_field'
    //   });
    // }
    // if (productObj.values.help_text_2) {
    //   variables.input.metafields.push({
    //     namespace: 'pim',
    //     key: 'help_text_2',
    //     value: productObj.values.help_text_2[0].data || 'No Help Text Available',
    //     type: 'multi_line_text_field'
    //   });
    // }
    // if (productObj.values.help_text_3) {
    //   variables.input.metafields.push({
    //     namespace: 'pim',
    //     key: 'help_text_3',
    //     value: productObj.values.help_text_3[0].data || 'No Help Text Available',
    //     type: 'multi_line_text_field'
    //   });
    // }

    // if (productObj.values['1_tire_diameter']) {
    //   variables.input.metafields.push({
    //     namespace: 'pim',
    //     key: '1_tire_diameter',
    //     value: (await makeRequest("GET", `${process.env.AKENEO_API_URI}attributes/1_tire_diameter/options/${productObj.values['1_tire_diameter'][0].data}`, null, null, null)).labels.en_US || 'No Max Tire Size Available',
    //     type: 'single_line_text_field'
    //   });
    // }
    // if (productObj.values['2_tire_diameter']) {
    //   variables.input.metafields.push({
    //     namespace: 'pim',
    //     key: '2_tire_diameter',
    //     value: (await makeRequest("GET", `${process.env.AKENEO_API_URI}attributes/2_tire_diameter/options/${productObj.values['2_tire_diameter'][0].data}`, null, null, null)).labels.en_US || 'No Max Tire Size Available',
    //     type: 'single_line_text_field'
    //   });
    // }
    // if (productObj.values['3_tire_diameter']) {
    //   variables.input.metafields.push({
    //     namespace: 'pim',
    //     key: '3_tire_diameter',
    //     value: (await makeRequest("GET", `${process.env.AKENEO_API_URI}attributes/3_tire_diameter/options/${productObj.values['3_tire_diameter'][0].data}`, null, null, null)).labels.en_US || 'No Max Tire Size Available',
    //     type: 'single_line_text_field'
    //   });
    // }

    // if (productObj.values['1_wheel_diameter']) {
    //   variables.input.metafields.push({
    //     namespace: 'pim',
    //     key: '1_wheel_diameter',
    //     value: (await makeRequest("GET", `${process.env.AKENEO_API_URI}attributes/1_wheel_diameter/options/${productObj.values['1_wheel_diameter'][0].data}`, null, null, null)).labels.en_US || 'No Wheel Diameter Available',
    //     type: 'single_line_text_field'
    //   });
    // }
    // if (productObj.values['2_wheel_diameter']) {
    //   variables.input.metafields.push({
    //     namespace: 'pim',
    //     key: '2_wheel_diameter',
    //     value: (await makeRequest("GET", `${process.env.AKENEO_API_URI}attributes/2_wheel_diameter/options/${productObj.values['2_wheel_diameter'][0].data}`, null, null, null)).labels.en_US || 'No Wheel Diameter Available',
    //     type: 'single_line_text_field'
    //   });
    // }
    // if (productObj.values['3_wheel_diameter']) {
    //   variables.input.metafields.push({
    //     namespace: 'pim',
    //     key: '3_wheel_diameter',
    //     value: (await makeRequest("GET", `${process.env.AKENEO_API_URI}attributes/3_wheel_diameter/options/${productObj.values['3_wheel_diameter'][0].data}`, null, null, null)).labels.en_US || 'No Wheel Diameter Available',
    //     type: 'single_line_text_field'
    //   });
    // }

    // if (productObj.values['1_backspacing']) {
    //   variables.input.metafields.push({
    //     namespace: 'pim',
    //     key: '1_backspacing',
    //     value: (await makeRequest("GET", `${process.env.AKENEO_API_URI}attributes/1_backspacing/options/${productObj.values['1_backspacing'][0].data}`, null, null, null)).labels.en_US || 'No BackSpace Available',
    //     type: 'single_line_text_field'
    //   });
    // }
    // if (productObj.values['2_backspacing']) {
    //   variables.input.metafields.push({
    //     namespace: 'pim',
    //     key: '2_backspacing',
    //     value: (await makeRequest("GET", `${process.env.AKENEO_API_URI}attributes/2_backspacing/options/${productObj.values['2_backspacing'][0].data}`, null, null, null)).labels.en_US || 'No BackSpace Available',
    //     type: 'single_line_text_field'
    //   });
    // }
    // if (productObj.values['3_backspacing']) {
    //   variables.input.metafields.push({
    //     namespace: 'pim',
    //     key: '3_backspacing',
    //     value: (await makeRequest("GET", `${process.env.AKENEO_API_URI}attributes/3_backspacing/options/${productObj.values['3_backspacing'][0].data}`, null, null, null)).labels.en_US || 'No BackSpace Available',
    //     type: 'single_line_text_field'
    //   });
    // }

    // if (cloudinaryImages.productImages && cloudinaryImages.productImages.length > 0) {
    //   for (const productImg of cloudinaryImages.productImages) {
    //     variables.input.images.push({ "altText": "", "src": productImg });
    //   }
    // }

    // if (sProduct.node.variants.edges.length > 0) {
    //   for (const variant of sProduct.node.variants.edges) {
    //     let eachVariant = {
    //       id: variant.node.id,
    //       sku: variant.node.sku,
    //       imageSrc: ''
    //     };
    //     const vImgs = cloudinaryImages.variantImages.filter(i => i.sku === variant.node.sku)[0];

    //     if (vImgs && vImgs.images.length > 0) {
    //       eachVariant.imageSrc = vImgs.images[0];
    //       variables.input.images.push({ "altText": "", "src": vImgs.images[0] });
    //     }

    //     variables.input.variants.push(eachVariant);
    //   }
    // }

    for(const category of productObj.categories) {
      if (category !== 'BDS_productCategories') {
        const categoryObj = await makeRequest("GET", `${process.env.AKENEO_API_URI}categories/${category}`, null, null, null);

        if (categoryObj.parent === 'BDS_productCategories' && variables.input.customProductType === null) {
          variables.input.customProductType = categoryObj.labels.en_US;
        }
      }
    }

    // console.log(JSON.stringify(variables, null, 2));

    const productUpdated = await makeGraphQlRequest(process.env.BDS_SUSPENSION_GRAPHQL_URI, mutation, accessToken, variables, true);
    console.log("The product has been updated...");
    resolve(productUpdated);
  });
}

const createShopifyProduct = async (productObj, productTagsArray, cloudinaryImages, accessToken) => {
  return new Promise(async (resolve) => {
    const variables = {
      input: {
        title: productObj.values.title? productObj.values.title[0].data : 'No Title Available',
        descriptionHtml: productObj.values.SDC_MKT_Description_body? productObj.values.SDC_MKT_Description_body[0].data : 'No Description Available',
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

    // Product Vendor
    if (productObj.values.stusa_brand && productObj.values.stusa_brand[0].data === 'bds') {
      variables.input.vendor = 'BDS Suspension';
    }

    // Specification
    if (productObj.categories.toString().includes('Kits')) {
      const specification = '<ul>' +
        '<li>Front Lift Method : ' + (productObj.values.PVG_BDS_Front_Lift_Method? (await makeRequest("GET", `${process.env.AKENEO_API_URI}attributes/PVG_BDS_Front_Lift_Method/options/${productObj.values.PVG_BDS_Front_Lift_Method[0].data}`, null, null, null)).labels.en_US : 'No Front Lift Method') + '</li>' +
        '<li>Rear Lift Method : ' + (productObj.values.PVG_BDS_Rear_Lift_Method? (await makeRequest("GET", `${process.env.AKENEO_API_URI}attributes/PVG_BDS_Rear_Lift_Method/options/${productObj.values.PVG_BDS_Rear_Lift_Method[0].data}`, null, null, null)).labels.en_US : 'No Rear Lift Method') + '</li>' +
        '<li>Shocks Included : ' + (productObj.values.PVG_BDS_Shocks_Included? productObj.values.PVG_BDS_Shocks_Included[0].data : 'No Shocks Included') + '</li>' +
        '<li>Front Lift Height : ' + (productObj.values.PVG_BDS_Front_Lift_Height? (await makeRequest("GET", `${process.env.AKENEO_API_URI}attributes/PVG_BDS_Front_Lift_Height/options/${productObj.values.PVG_BDS_Front_Lift_Height[0].data}`, null, null, null)).labels.en_US : 'No Front Lift Height') + '</li>' +
        '<li>Rear Lift Height : ' + (productObj.values.PVG_BDS_Rear_Lift_Height? (await makeRequest("GET", `${process.env.AKENEO_API_URI}attributes/PVG_BDS_Rear_Lift_Height/options/${productObj.values.PVG_BDS_Rear_Lift_Height[0].data}`, null, null, null)).labels.en_US : 'No Rear Lift Height') + '</li>' +
      '</ul>';
      variables.input.metafields.push({
        namespace: 'pim',
        key: 'specification',
        value: specification,
        type: 'multi_line_text_field'
      });
      variables.input.variants[0].metafields.push({
        namespace: 'pim',
        key: 'specification',
        value: specification,
        type: 'multi_line_text_field'
      });
    } else if (productObj.categories.toString().includes('Shocks')) {
      const specification = '<ul>' +
        '<li>Type : Shocks</li>' +
        '<li>Lower Mount Type : ' + (productObj.values.PVG_BDS_Lower_Mount_Type? (await makeRequest("GET", `${process.env.AKENEO_API_URI}attributes/PVG_BDS_Lower_Mount_Type/options/${productObj.values.PVG_BDS_Lower_Mount_Type[0].data}`, null, null, null)).labels.en_US : 'No Lower Mount Type') + '</li>' +
        '<li>Upper Mount Type : ' + (productObj.values.PVG_BDS_Upper_Mount_Code? (await makeRequest("GET", `${process.env.AKENEO_API_URI}attributes/PVG_BDS_Upper_Mount_Code/options/${productObj.values.PVG_BDS_Upper_Mount_Code[0].data}`, null, null, null)).labels.en_US : 'No Upper Mount Type') + '</li>' +
        '<li>Gas Charged : ' + (productObj.values.PVG_BDS_Gas_Charged? productObj.values.PVG_BDS_Gas_Charged[0].data : 'No Gas Charged') + '</li>' +
        '<li>Adjustable : ' + (productObj.values.PVG_BDS_Adjustable? productObj.values.PVG_BDS_Adjustable[0].data : 'No Adjustable') + '</li>' +
        '<li>Adjustable Dampening : ' + (productObj.values.PVG_BDS_Adjustable_Dampening? productObj.values.PVG_BDS_Adjustable_Dampening[0].data : 'No Adjustable Dampening') + '</li>' +
        '<li>Compressed Length : ' + (productObj.values.PVG_BDS_Compressed_Length? productObj.values.PVG_BDS_Compressed_Length[0].data.amount + ' ' + productObj.values.PVG_BDS_Compressed_Length[0].data.unit : 'No Compressed Length') + '</li>' +
        '<li>Travel Length : ' + (productObj.values.PVG_BDS_Travel_Length? productObj.values.PVG_BDS_Travel_Length[0].data.amount + ' ' + productObj.values.PVG_BDS_Travel_Length[0].data.unit : 'No Travel Length') + '</li>' +
        '<li>Shaft Diameter : ' + (productObj.values.PVG_BDS_Shaft_Diameter? productObj.values.PVG_BDS_Shaft_Diameter[0].data : 'No Shaft Diameter') + '</li>' +
      '</ul>';
      variables.input.metafields.push({
        namespace: 'pim',
        key: 'specification',
        value: specification,
        type: 'multi_line_text_field'
      });
      variables.input.variants[0].metafields.push({
        namespace: 'pim',
        key: 'specification',
        value: specification,
        type: 'multi_line_text_field'
      });
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

    if (productObj.values.zn_installation_time) {
      variables.input.metafields.push({
        namespace: 'pim',
        key: 'time',
        value: (await getInstallation('zn_installation_time', productObj.values.zn_installation_time[0].data)),
        type: 'single_line_text_field'
      });
      variables.input.variants[0].metafields.push({
        namespace: 'pim',
        key: 'time',
        value: (await getInstallation('zn_installation_time', productObj.values.zn_installation_time[0].data)),
        type: 'single_line_text_field'
      });
    }

    if (productObj.values.zn_installation_difficulty) {
      variables.input.metafields.push({
        namespace: 'pim',
        key: 'difficulty',
        value: formatOption(productObj.values.zn_installation_difficulty[0].data),
        type: 'single_line_text_field'
      });
      variables.input.variants[0].metafields.push({
        namespace: 'pim',
        key: 'difficulty',
        value: formatOption(productObj.values.zn_installation_difficulty[0].data),
        type: 'single_line_text_field'
      });
    }

    if (productObj.values.zn_installation_tools) {
      variables.input.metafields.push({
        namespace: 'pim',
        key: 'tools',
        value: (await getInstallation('zn_installation_tools', productObj.values.zn_installation_tools[0].data)),
        type: 'single_line_text_field'
      });
      variables.input.variants[0].metafields.push({
        namespace: 'pim',
        key: 'tools',
        value: (await getInstallation('zn_installation_tools', productObj.values.zn_installation_tools[0].data)),
        type: 'single_line_text_field'
      });
    }

    // Add Product Features Metafield
    if (productObj.values.SDC_FAB_zn_features) {
      variables.input.metafields.push({
        namespace: 'pim',
        key: 'product_features',
        value: productObj.values.SDC_FAB_zn_features[0].data || 'No Product Features Available',
        type: 'multi_line_text_field'
      });
      variables.input.variants[0].metafields.push({
        namespace: 'pim',
        key: 'product_features',
        value: productObj.values.SDC_FAB_zn_features[0].data || 'No Product Features Available',
        type: 'multi_line_text_field'
      });
    }

    // Add Meta Title and Meta Description if available, both pim and global on the product. Pim only on the variant.
    if (productObj.values.meta_title) {
      variables.input.metafields.push({
        namespace: 'pim',
        key: 'meta_title',
        value: productObj.values.meta_title[0].data || 'No Meta Title Available',
        type: 'multi_line_text_field'
      },
      {
        namespace: 'global',
        key: 'title_tag',
        value: productObj.values.meta_title[0].data || 'No Meta Title Available',
        type: 'multi_line_text_field'
      });

      variables.input.variants[0].metafields.push({
        namespace: 'pim',
        key: 'meta_title',
        value: productObj.values.meta_title[0].data || 'No Meta Title Available',
        type: 'multi_line_text_field'
      });
    }
    if (productObj.values.meta_description) {
      variables.input.metafields.push({
        namespace: 'pim',
        key: 'meta_description',
        value: productObj.values.meta_description[0].data || 'No Meta Description Available',
        type: 'multi_line_text_field'
      },
      {
        namespace: 'global',
        key: 'description_tag',
        value: productObj.values.meta_description[0].data || 'No Meta Description Available',
        type: 'multi_line_text_field'
      });

      variables.input.variants[0].metafields.push({
        namespace: 'pim',
        key: 'meta_description',
        value: productObj.values.meta_description[0].data || 'No Meta Description Available',
        type: 'multi_line_text_field'
      });
    }

    if (productObj.associations.BDS_add_on) {
      const addOnsValue = productObj.associations.BDS_add_on.products 
        ? productObj.associations.BDS_add_on.products.join(',') 
        : 'No Add Ons Available';

      variables.input.metafields.push({
        namespace: 'pim',
        key: 'add_ons',
        value: addOnsValue,
        type: 'multi_line_text_field'
      });
    }

    if (productObj.values['1_tire_diameter']) {
      variables.input.metafields.push({
        namespace: 'pim',
        key: '1_tire_diameter',
        value: (await makeRequest("GET", `${process.env.AKENEO_API_URI}attributes/1_tire_diameter/options/${productObj.values['1_tire_diameter'][0].data}`, null, null, null)).labels.en_US || 'No Max Tire Size Available',
        type: 'single_line_text_field'
      });
    }
    if (productObj.values['2_tire_diameter']) {
      variables.input.metafields.push({
        namespace: 'pim',
        key: '2_tire_diameter',
        value: (await makeRequest("GET", `${process.env.AKENEO_API_URI}attributes/2_tire_diameter/options/${productObj.values['2_tire_diameter'][0].data}`, null, null, null)).labels.en_US || 'No Max Tire Size Available',
        type: 'single_line_text_field'
      });
    }
    if (productObj.values['3_tire_diameter']) {
      variables.input.metafields.push({
        namespace: 'pim',
        key: '3_tire_diameter',
        value: (await makeRequest("GET", `${process.env.AKENEO_API_URI}attributes/3_tire_diameter/options/${productObj.values['3_tire_diameter'][0].data}`, null, null, null)).labels.en_US || 'No Max Tire Size Available',
        type: 'single_line_text_field'
      });
    }

    if (productObj.values['1_wheel_diameter']) {
      variables.input.metafields.push({
        namespace: 'pim',
        key: '1_wheel_diameter',
        value: (await makeRequest("GET", `${process.env.AKENEO_API_URI}attributes/1_wheel_diameter/options/${productObj.values['1_wheel_diameter'][0].data}`, null, null, null)).labels.en_US || 'No Wheel Diameter Available',
        type: 'single_line_text_field'
      });
    }
    if (productObj.values['2_wheel_diameter']) {
      variables.input.metafields.push({
        namespace: 'pim',
        key: '2_wheel_diameter',
        value: (await makeRequest("GET", `${process.env.AKENEO_API_URI}attributes/2_wheel_diameter/options/${productObj.values['2_wheel_diameter'][0].data}`, null, null, null)).labels.en_US || 'No Wheel Diameter Available',
        type: 'single_line_text_field'
      });
    }
    if (productObj.values['3_wheel_diameter']) {
      variables.input.metafields.push({
        namespace: 'pim',
        key: '3_wheel_diameter',
        value: (await makeRequest("GET", `${process.env.AKENEO_API_URI}attributes/3_wheel_diameter/options/${productObj.values['3_wheel_diameter'][0].data}`, null, null, null)).labels.en_US || 'No Wheel Diameter Available',
        type: 'single_line_text_field'
      });
    }

    if (productObj.values['1_backspacing']) {
      variables.input.metafields.push({
        namespace: 'pim',
        key: '1_backspacing',
        value: (await makeRequest("GET", `${process.env.AKENEO_API_URI}attributes/1_backspacing/options/${productObj.values['1_backspacing'][0].data}`, null, null, null)).labels.en_US || 'No BackSpace Available',
        type: 'single_line_text_field'
      });
    }
    if (productObj.values['2_backspacing']) {
      variables.input.metafields.push({
        namespace: 'pim',
        key: '2_backspacing',
        value: (await makeRequest("GET", `${process.env.AKENEO_API_URI}attributes/2_backspacing/options/${productObj.values['2_backspacing'][0].data}`, null, null, null)).labels.en_US || 'No BackSpace Available',
        type: 'single_line_text_field'
      });
    }
    if (productObj.values['3_backspacing']) {
      variables.input.metafields.push({
        namespace: 'pim',
        key: '3_backspacing',
        value: (await makeRequest("GET", `${process.env.AKENEO_API_URI}attributes/3_backspacing/options/${productObj.values['3_backspacing'][0].data}`, null, null, null)).labels.en_US || 'No BackSpace Available',
        type: 'single_line_text_field'
      });
    }

    // Add Product Images
    if (cloudinaryImages.productImages && cloudinaryImages.productImages.length > 0) {
      for (const productImg of cloudinaryImages.productImages) {
        variables.input.images.push({ "altText": "", "src": productImg });
      }
    }
    
    // Product Type - Loop through tags and find any match for Kits, Parts, or Merchandise. If match, set product type to that.
    // for (let i = 0; i < productTagsArray.length; i++) {
    //   if (productTagsArray[i] === 'Kits') {
    //     variables.input.customProductType = 'Kits';
    //     break;
    //   } else if (productTagsArray[i] === 'Parts') {
    //     variables.input.customProductType = 'Parts';
    //     break;
    //   } else if (productTagsArray[i] === 'Merchandise') {
    //     variables.input.customProductType = 'Merchandise';
    //     break;
    //   } else {
    //     variables.input.customProductType = 'Other';
    //   }
    // }

    for(const category of productObj.categories) {
      if (category !== 'BDS_productCategories') {
        const categoryObj = await makeRequest("GET", `${process.env.AKENEO_API_URI}categories/${category}`, null, null, null);

        if (categoryObj.parent === 'BDS_productCategories' && variables.input.customProductType === null) {
          variables.input.customProductType = categoryObj.labels.en_US;
        }
      }
    }

    // console.log(JSON.stringify(variables, null, 2));

    const productCreated = await makeGraphQlRequest(process.env.BDS_SUSPENSION_GRAPHQL_URI, mutation, accessToken, variables, true);
    console.log("The product was created...");
    resolve(productCreated);
  });
}

const formatOption = (str) => {
  return str.toString().split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

const getInstallation = async (key, value) => {
  let result = '';
  if (key.includes('tools')) {
    for (const item of value) {
      result += (await makeRequest("GET", `${process.env.AKENEO_API_URI}attributes/${key}/options/${item}`, null, null, null)).labels.en_US + ', ';
    }
    result = result.slice(0, -2);
  } else {
    result = (await makeRequest("GET", `${process.env.AKENEO_API_URI}attributes/${key}/options/${value}`, null, null, null)).labels.en_US;
  }

  return result;
}

const createShopifyVariantProduct = async (productObj, productTagsArray, cloudinaryImages, accessToken) => {
  return new Promise(async (resolve) => {
    const product = productObj.product;
    const variants = productObj.variants;
    let tags = productTagsArray;
    const variables = {
      input: {
        title: product.values.title? product.values.title[0].data : 'No Title Available',
        descriptionHtml: product.values.SDC_MKT_Description_body? product.values.SDC_MKT_Description_body[0].data : 'No Description Available',
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

    const resData = await makeRequest('GET', `${process.env.AKENEO_API_URI}families/${product.family}/variants/${product.family_variant}`, null, null, null);
    
    const options = [];
    for (const attribute of resData.variant_attribute_sets) {
      options.push(attribute.axes[0]);
      variables.input.options.push(formatOption(attribute.axes[0]));
    }
    
    // Product Vendor
    if (product.values.stusa_brand && product.values.stusa_brand[0].data === 'bds') {
      variables.input.vendor = 'BDS Suspension';
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
    if (product.values.zn_installation_time) {
      variables.input.metafields.push({
        namespace: 'pim',
        key: 'time',
        value: (await getInstallation('zn_installation_time', product.values.zn_installation_time[0].data)),
        type: 'single_line_text_field'
      });
    }
    if (product.values.zn_installation_difficulty) {
      variables.input.metafields.push({
        namespace: 'pim',
        key: 'difficulty',
        value: formatOption(product.values.zn_installation_difficulty[0].data),
        type: 'single_line_text_field'
      });
    }
    if (product.values.zn_installation_tools) {
      variables.input.metafields.push({
        namespace: 'pim',
        key: 'tools',
        value: (await getInstallation('zn_installation_tools', product.values.zn_installation_tools[0].data)),
        type: 'single_line_text_field'
      });
    }
    if (product.values.SDC_FAB_zn_features) {
      variables.input.metafields.push({
        namespace: 'pim',
        key: 'product_features',
        value: product.values.SDC_FAB_zn_features[0].data || 'No Product Features Available',
        type: 'multi_line_text_field'
      });
    }
    if (product.values.meta_title) {
      variables.input.metafields.push({
        namespace: 'pim',
        key: 'meta_title',
        value: product.values.meta_title[0].data.toString().replace(/"/g, '') || 'No Meta Title Available',
        type: 'multi_line_text_field'
      })
    }
    if (product.values.meta_description) {
      variables.input.metafields.push({
        namespace: 'pim',
        key: 'meta_description',
        value: product.values.meta_description[0].data.toString().replace(/"/g, '') || 'No Meta Description Available',
        type: 'multi_line_text_field'
      });
    }
    if (product.values.help_text_1) {
      variables.input.metafields.push({
        namespace: 'pim',
        key: 'help_text_1',
        value: product.values.help_text_1[0].data || 'No Meta Description Available',
        type: 'multi_line_text_field'
      });
    }
    if (product.values.help_text_2) {
      variables.input.metafields.push({
        namespace: 'pim',
        key: 'help_text_2',
        value: product.values.help_text_2[0].data || 'No Meta Description Available',
        type: 'multi_line_text_field'
      });
    }
    if (product.values.help_text_3) {
      variables.input.metafields.push({
        namespace: 'pim',
        key: 'help_text_3',
        value: product.values.help_text_3[0].data || 'No Meta Description Available',
        type: 'multi_line_text_field'
      });
    }
    if (product.associations.BDS_add_on) {
      const addOnsValue = product.associations.BDS_add_on.products 
        ? product.associations.BDS_add_on.products.join(',') 
        : 'No Add Ons Available';

      variables.input.metafields.push({
        namespace: 'pim',
        key: 'add_ons',
        value: addOnsValue,
        type: 'multi_line_text_field'
      });
    }

    if (product.values['1_tire_diameter']) {
      variables.input.metafields.push({
        namespace: 'pim',
        key: '1_tire_diameter',
        value: (await makeRequest("GET", `${process.env.AKENEO_API_URI}attributes/1_tire_diameter/options/${product.values['1_tire_diameter'][0].data}`, null, null, null)).labels.en_US || 'No Max Tire Size Available',
        type: 'single_line_text_field'
      });
    }
    if (product.values['2_tire_diameter']) {
      variables.input.metafields.push({
        namespace: 'pim',
        key: '2_tire_diameter',
        value: (await makeRequest("GET", `${process.env.AKENEO_API_URI}attributes/2_tire_diameter/options/${product.values['2_tire_diameter'][0].data}`, null, null, null)).labels.en_US || 'No Max Tire Size Available',
        type: 'single_line_text_field'
      });
    }
    if (product.values['3_tire_diameter']) {
      variables.input.metafields.push({
        namespace: 'pim',
        key: '3_tire_diameter',
        value: (await makeRequest("GET", `${process.env.AKENEO_API_URI}attributes/3_tire_diameter/options/${product.values['3_tire_diameter'][0].data}`, null, null, null)).labels.en_US || 'No Max Tire Size Available',
        type: 'single_line_text_field'
      });
    }

    if (product.values['1_wheel_diameter']) {
      variables.input.metafields.push({
        namespace: 'pim',
        key: '1_wheel_diameter',
        value: (await makeRequest("GET", `${process.env.AKENEO_API_URI}attributes/1_wheel_diameter/options/${product.values['1_wheel_diameter'][0].data}`, null, null, null)).labels.en_US || 'No Wheel Diameter Available',
        type: 'single_line_text_field'
      });
    }
    if (product.values['2_wheel_diameter']) {
      variables.input.metafields.push({
        namespace: 'pim',
        key: '2_wheel_diameter',
        value: (await makeRequest("GET", `${process.env.AKENEO_API_URI}attributes/2_wheel_diameter/options/${product.values['2_wheel_diameter'][0].data}`, null, null, null)).labels.en_US || 'No Wheel Diameter Available',
        type: 'single_line_text_field'
      });
    }
    if (product.values['3_wheel_diameter']) {
      variables.input.metafields.push({
        namespace: 'pim',
        key: '3_wheel_diameter',
        value: (await makeRequest("GET", `${process.env.AKENEO_API_URI}attributes/3_wheel_diameter/options/${product.values['3_wheel_diameter'][0].data}`, null, null, null)).labels.en_US || 'No Wheel Diameter Available',
        type: 'single_line_text_field'
      });
    }

    if (product.values['1_backspacing']) {
      variables.input.metafields.push({
        namespace: 'pim',
        key: '1_backspacing',
        value: (await makeRequest("GET", `${process.env.AKENEO_API_URI}attributes/1_backspacing/options/${product.values['1_backspacing'][0].data}`, null, null, null)).labels.en_US || 'No BackSpace Available',
        type: 'single_line_text_field'
      });
    }
    if (product.values['2_backspacing']) {
      variables.input.metafields.push({
        namespace: 'pim',
        key: '2_backspacing',
        value: (await makeRequest("GET", `${process.env.AKENEO_API_URI}attributes/2_backspacing/options/${product.values['2_backspacing'][0].data}`, null, null, null)).labels.en_US || 'No BackSpace Available',
        type: 'single_line_text_field'
      });
    }
    if (product.values['3_backspacing']) {
      variables.input.metafields.push({
        namespace: 'pim',
        key: '3_backspacing',
        value: (await makeRequest("GET", `${process.env.AKENEO_API_URI}attributes/3_backspacing/options/${product.values['3_backspacing'][0].data}`, null, null, null)).labels.en_US || 'No BackSpace Available',
        type: 'single_line_text_field'
      });
    }

    if (cloudinaryImages.productImages && cloudinaryImages.productImages.length > 0) {
      for (const image of cloudinaryImages.productImages) {
        variables.input.images.push({ "altText": "", "src": image });
      }
    }

    for (let k = 0; k < variants.length; k ++) {
      let eachVariant = {
        // title: variants[k].values.title ? variants[k].values.title[0].data : 'No Title Available',
        sku: variants[k].identifier,
        options: [],
        position: k + 1,
        price: variants[k].values.price ? variants[k].values.price[0].data[0].amount : '0.00',
        weight: variants[k].values.weight ? Number(variants[k].values.weight[0].data.amount) : 0.00,
        barcode: variants[k].values.PVG_UPC ? Math.trunc(Number(variants[k].values.PVG_UPC[0].data)).toString() : null,
        metafields: [],
        imageSrc: ''
      };

      for (const option of options) {
        if (variants[k].values[option]) {
          const op = await makeRequest("GET", `${process.env.AKENEO_API_URI}attributes/${option}/options/${variants[k].values[option][0].data}`, null, null, null);
          eachVariant.options.push(op.labels.en_US);
        } else {
          eachVariant.options.push('');
        }
      }

      if (variants[k].values.zn_fitment) {
        eachVariant.metafields.push({
          namespace: 'pim',
          key: 'fitment_details',
          value: variants[k].values.zn_fitment[0].data.toString().replace(/"/g, '') || 'No Fitment Available',
          type: 'single_line_text_field'
        });
      }

      if (product.categories.toString().includes('Kits')) {
        const specification = '<ul>' +
          '<li>Front Lift Method : ' + (variants[k].values.PVG_BDS_Front_Lift_Method? (await makeRequest("GET", `${process.env.AKENEO_API_URI}attributes/PVG_BDS_Front_Lift_Method/options/${variants[k].values.PVG_BDS_Front_Lift_Method[0].data}`, null, null, null)).labels.en_US : 'No Front Lift Method') + '</li>' +
          '<li>Rear Lift Method : ' + (variants[k].values.PVG_BDS_Rear_Lift_Method? (await makeRequest("GET", `${process.env.AKENEO_API_URI}attributes/PVG_BDS_Rear_Lift_Method/options/${variants[k].values.PVG_BDS_Rear_Lift_Method[0].data}`, null, null, null)).labels.en_US : 'No Rear Lift Method') + '</li>' +
          '<li>Shocks Included : ' + (variants[k].values.PVG_BDS_Shocks_Included? variants[k].values.PVG_BDS_Shocks_Included[0].data : 'No Shocks Included') + '</li>' +
          '<li>Front Lift Height : ' + (variants[k].values.PVG_BDS_Front_Lift_Height? (await makeRequest("GET", `${process.env.AKENEO_API_URI}attributes/PVG_BDS_Front_Lift_Height/options/${variants[k].values.PVG_BDS_Front_Lift_Height[0].data}`, null, null, null)).labels.en_US : 'No Front Lift Height') + '</li>' +
          '<li>Rear Lift Height : ' + (variants[k].values.PVG_BDS_Rear_Lift_Height? (await makeRequest("GET", `${process.env.AKENEO_API_URI}attributes/PVG_BDS_Rear_Lift_Height/options/${variants[k].values.PVG_BDS_Rear_Lift_Height[0].data}`, null, null, null)).labels.en_US : 'No Rear Lift Height') + '</li>' +
        '</ul>';
        
        eachVariant.metafields.push({
          namespace: 'pim',
          key: 'specification',
          value: specification,
          type: 'multi_line_text_field'
        });
      } else if (product.categories.toString().includes('Shocks')) {
        const specification = '<ul>' +
          '<li>Type : Shocks</li>' +
          '<li>Lower Mount Type : ' + (variants[k].values.PVG_BDS_Lower_Mount_Type? (await makeRequest("GET", `${process.env.AKENEO_API_URI}attributes/PVG_BDS_Lower_Mount_Type/options/${variants[k].values.PVG_BDS_Lower_Mount_Type[0].data}`, null, null, null)).labels.en_US : 'No Lower Mount Type') + '</li>' +
          '<li>Upper Mount Type : ' + (variants[k].values.PVG_BDS_Upper_Mount_Code? (await makeRequest("GET", `${process.env.AKENEO_API_URI}attributes/PVG_BDS_Upper_Mount_Code/options/${variants[k].values.PVG_BDS_Upper_Mount_Code[0].data}`, null, null, null)).labels.en_US : 'No Upper Mount Type') + '</li>' +
          '<li>Gas Charged : ' + (variants[k].values.PVG_BDS_Gas_Charged? variants[k].values.PVG_BDS_Gas_Charged[0].data : 'No Gas Charged') + '</li>' +
          '<li>Adjustable : ' + (variants[k].values.PVG_BDS_Adjustable? variants[k].values.PVG_BDS_Adjustable[0].data : 'No Adjustable') + '</li>' +
          '<li>Adjustable Dampening : ' + (variants[k].values.PVG_BDS_Adjustable_Dampening? variants[k].values.PVG_BDS_Adjustable_Dampening[0].data : 'No Adjustable Dampening') + '</li>' +
          '<li>Compressed Length : ' + (variants[k].values.PVG_BDS_Compressed_Length? variants[k].values.PVG_BDS_Compressed_Length[0].data.amount + ' ' + variants[k].values.PVG_BDS_Compressed_Length[0].data.unit : 'No Compressed Length') + '</li>' +
          '<li>Travel Length : ' + (variants[k].values.PVG_BDS_Travel_Length? variants[k].values.PVG_BDS_Travel_Length[0].data.amount + ' ' + variants[k].values.PVG_BDS_Travel_Length[0].data.unit : 'No Travel Length') + '</li>' +
          '<li>Shaft Diameter : ' + (variants[k].values.PVG_BDS_Shaft_Diameter? variants[k].values.PVG_BDS_Shaft_Diameter[0].data : 'No Shaft Diameter') + '</li>' +
        '</ul>';

        eachVariant.metafields.push({
          namespace: 'pim',
          key: 'specification',
          value: specification,
          type: 'multi_line_text_field'
        });
      }

      const vImgs = cloudinaryImages.variantImages.filter(i => i.sku === variants[k].identifier)[0];

      if (vImgs && vImgs.images.length > 0) {
        eachVariant.imageSrc = vImgs.images[0];
        variables.input.images.push({ "altText": "", "src": vImgs.images[0] });
      }
      
      variables.input.variants.push(eachVariant);
    }

    for(const category of product.categories) {
      if (category !== 'BDS_productCategories') {
        const categoryObj = await makeRequest("GET", `${process.env.AKENEO_API_URI}categories/${category}`, null, null, null);
        
        if (categoryObj.parent === 'BDS_productCategories' && variables.input.customProductType === null) {
          variables.input.customProductType = categoryObj.labels.en_US;
        }
      }
    }

    // console.log(JSON.stringify(variables, null, 2));

    const productCreated = await makeGraphQlRequest(process.env.BDS_SUSPENSION_GRAPHQL_URI, mutation, accessToken, variables, true);
    console.log("The product was created...");
    resolve(productCreated);
  });
}

module.exports = {
  createShopifyProduct,
  updateShopifyProduct,
  createShopifyVariantProduct
};