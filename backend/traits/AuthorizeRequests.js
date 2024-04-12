const AkeneoAuthService  = require('../services/Akeneo/AkeneoAuthService');

function resolveAuthorization() {
    const accessToken = resolveAccessToken();
    return accessToken;
}

async function resolveAccessToken() {
    const authenticationService = AkeneoAuthService;
    return await authenticationService.getClientCredentialsToken();
}

module.exports = {
    resolveAuthorization
};
