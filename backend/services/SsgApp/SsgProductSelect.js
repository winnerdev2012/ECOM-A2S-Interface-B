// Import helpers
const { getCategories, getProductFamily, getTravel, getColor, getResult } = require('./SsgHelpers');

const handleQuery = async (req, res) => {
    let reqObject = req.query;
    let response = {
        "filters": [reqObject],
        "result": {}
    };

    switch (Object.keys(req.query).length) {
        case 0:
            response["result"] = { "categories": await getCategories() };
            break;
        case 1:
            response["result"] = { "product_families": await getProductFamily(req.query.category) };
            break;
        case 2:
            response["result"] = { "travel_options": await getTravel(req.query.category, req.query.product_family) };
            break;
        case 3:
            response["result"] = { "colors": await getColor(req.query.category, req.query.product_family, req.query.travel_option) };
            break;
        case 4:
            response["result"] = { "rec_string": await getResult({
                category: req.query.category, 
                product_family: req.query.product_family, 
                travel: req.query.travel, 
                color: req.query.color
            }) };
            break;    
        default:
            break;
    }

    return response;
}

// Export module
module.exports = {
    handleQuery
}