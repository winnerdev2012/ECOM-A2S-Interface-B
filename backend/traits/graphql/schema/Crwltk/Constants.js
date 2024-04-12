const UPDATE_ZONE_PRODUCT = `
mutation productUpdate($input: ProductInput!) {
    productUpdate(input: $input) {
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
}`;

const ZONE_PRODUCT_SELECTION_SET = 'product { metafields(first: 100) { edges { node { namespace key value } } } }';

module.exports = {UPDATE_ZONE_PRODUCT, ZONE_PRODUCT_SELECTION_SET}