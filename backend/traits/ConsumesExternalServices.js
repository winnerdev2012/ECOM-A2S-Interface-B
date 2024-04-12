const axios = require('axios');
const Qs = require('qs');
const { resolveAuthorization } = require('../traits/AuthorizeRequests');

async function makeRequest(requestMethod, url, queryParams, data, headers) {
  try {
    const axiosClient = axios.create({
      paramsSerializer: (params) => Qs.stringify(params, { arrayFormat: 'brackets' })
    });

    if (url.includes(process.env.AKENEO_API_URI)) {
      headers = { ...headers, 'Authorization': await resolveAuthorization() };
    }

    const options = {
      method: requestMethod,
      url: url,
      params: queryParams,
      data: data || {},
      headers: headers
    };

    const response = await axiosClient(options);
    return response.data;
  } catch (error) {
    console.error("This is the request error: ", error);
    throw error;
  }
}

module.exports = {
  makeRequest
};