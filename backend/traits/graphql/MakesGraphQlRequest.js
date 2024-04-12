const axios = require("axios");

async function makeGraphQlRequest(url, query, accessToken, variables, isMutation) {
  try {
    const options = !isMutation? {
      method: "POST",
      url: url,
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
      data: {
        query: query,
        variables: variables,
      },
    } : {
      method: "POST",
      url: url,
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
      data: {
        query: query,
        variables: variables,
      },
    };
    
    const response = await axios(options);
    return response.data;
  } catch (error) {
    console.error("ERROR: ", error);
  }
};

module.exports = makeGraphQlRequest;