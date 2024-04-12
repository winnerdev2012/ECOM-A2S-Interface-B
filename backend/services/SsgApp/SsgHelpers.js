// MongoDB Models
const SsgForkProduct = require('../../models/SSG/SsgFork')

// Services
const { getAkeneoSsgRefEntityData } = require('../Akeneo/AkeneoStagingService')

const getCategories = async () => {
    // Loop through all products and add unique categories to array
    const productList = await SsgForkProduct.find()
    const categoriesList = []
    for (let i = 0; i < productList.length; i++) {
        if (!categoriesList.includes(productList[i].category_level_1)) {
            categoriesList.push(productList[i].category_level_1)
        }
    }
    return categoriesList
}

const getProductFamily = async (queryArgs) => {
    const productList = await SsgForkProduct.find()
    const productFamilyList = []
    for (let i = 0; i < productList.length; i++) {
        if (!productFamilyList.includes(productList[i].family)) {
            productFamilyList.push(productList[i].family)
        }
    }
    return productFamilyList
}

const getTravel = async (queryArgs) => {
    const productList = await SsgForkProduct.find()
    const travelList = []
    for (let i = 0; i < productList.length; i++) {
        if (!travelList.includes(productList[i].travel)) {
            travelList.push(productList[i].travel)
        }
    }
    return travelList
}

const getColor = async (queryArgs) => {
    const productList = await SsgForkProduct.find()
    const colorList = []
    for (let i = 0; i < productList.length; i++) {
        if (!colorList.includes(productList[i].color)) {
            colorList.push(productList[i].color)
        }
    }
    return colorList
}

const getResult = async (queryArgs) => {
    const { category, product_family, travel, color } = queryArgs
    console.log(category, product_family, travel, color)
    const productList = await SsgForkProduct.find()
    const matchingProducts = []
    const result = []
    // Loop through products and add matching products to array
    for (let i = 0; i < productList.length; i++) {
        if (productList[i].category_level_1 === category && productList[i].family === product_family && productList[i].travel === travel && productList[i].color === color) {
            matchingProducts.push(productList[i])
        }
    }
    // Loop through matching products and add unique product.ref_entity to array
    for (let i = 0; i < matchingProducts.length; i++) {
        if (!result.includes(matchingProducts[i].ref_entity)) {
            result.push(matchingProducts[i].ref_entity)
        }
    }

    const recommendationString = await getAkeneoSsgRefEntityData(result)

    return recommendationString
}


// Module Exports
module.exports = {
    getCategories,
    getProductFamily,
    getTravel,
    getColor,
    getResult
}