const { makeGraphQlRequest } = require('../../traits/graphql/MakesGraphQlRequest');

async function createShopifyProductMetafields(productObj) {
  return new Promise(async (resolve, reject) => {
    let variables = {
      "input": {
        // "id": innerObj['shopifyId'],
        "metafields": [
          {
            "namespace": "pim",
            "key": "meta_title",
            "value": productObj.values.meta_title[0].data,
            "type": "single_line_text_field"
          },
          {
            "namespace": "pim",
            "key": "meta_description",
            "value": productObj.values.meta_description[0].data,
            "type": "single_line_text_field"
          },
          {
            "namespace": "global",
            "key": "title_tag",
            "value": productObj.values.meta_title[0].data,
            "type": "single_line_text_field"
          },
          {
            "namespace": "global",
            "key": "description_tag",
            "value": productObj.values.meta_description[0].data,
            "type": "single_line_text_field"
          }
        ]
      }
    };

    resolve(variables);

    let mutation = new Mutation('productUpdate')
      .setVariables([new Variable('input', 'ProductInput', true)])
      .setArguments({'input': '$input'})
      .setSelectionSet('product { metafields(first: 100) { edges { node { namespace key value } } } }');

    // makeGraphQlRequest(mutation, variables, zoneGraphUri, accessToken);
  });
}

// Update Product Metafields
async function updateShopifyProductMetafields(productObj) {
  let innerObj = Object.values(productObj)[0];
  let variables = {
    "input": {
      "id": innerObj['shopifyId'],
      "metafields": [
        {
          "id": innerObj['shopifyMetafields']['meta_title'].id,
          "namespace": innerObj['shopifyMetafields']['meta_title'].namespace,
          "key": innerObj['shopifyMetafields']['meta_title'].key,
          "value": innerObj['akeneoObj'].values.meta_title[0].data,
          "type": "single_line_text_field"
        },
        {
          "id": innerObj['shopifyMetafields']['meta_description'].id,
          "namespace": innerObj['shopifyMetafields']['meta_description'].namespace,
          "key": innerObj['shopifyMetafields']['meta_description'].key,
          "value": innerObj['akeneoObj'].values.meta_description[0].data,
          "type": "single_line_text_field"
        }
      ]
    }
  };

  let mutation = new Mutation('productUpdate')
    .setVariables([new Variable('input', 'ProductInput', true)])
    .setArguments({ 'input': '$input' })
    .setSelectionSet('product { metafields(first: 100) { edges { node { namespace key value } } } }');


  makeGraphQlRequest(mutation, variables, zoneGraphUri, accessToken);

  return "Update metafields called and ran!";
}

module.exports = {
  createShopifyProductMetafields,
  updateShopifyProductMetafields
}