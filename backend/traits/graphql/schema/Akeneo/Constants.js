const GET_SHOPIFY_PRODUCTS = () => {
  return `query {
    products(first: 30) {
      edges {
        cursor
        node {
          id
          metafields(first: 10) {
            edges {
              node {
                id
                namespace
                key
                value
              }
            }
          }
          variants(first:15) {
            edges {
              node {
                id
                sku
              }
            }
          }
        }
      }
    }
  }`;
}

const GET_SHOPIFY_PRODUCTS_WITH_CURSOR = (cursor) => {
  return `query {
    products(first: 30, after: "${cursor}") {
      edges {
        cursor
        node {
          id
          title
          metafields(first: 10) {
            edges {
              node {
                id
                namespace
                key
                value
              }
            }
          }
          variants(first:15) {
            edges {
              node {
                id
                sku
              }
            }
          }
        }
      }
    }
  }`;
}

module.exports = {
  GET_SHOPIFY_PRODUCTS,
  GET_SHOPIFY_PRODUCTS_WITH_CURSOR
}