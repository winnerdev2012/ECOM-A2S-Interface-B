const { makeRequest } = require('../../traits/ConsumesExternalServices');
async function createProductTags(akeneoProduct) {
  const mergedProductsArray = [];

  async function createTagsFromProductAttributes() {
    console.log("Creating tags from product attributes...");
    const productAttributes = {
      price: akeneoProduct.values.price,
      stusa_brand: akeneoProduct.values.stusa_brand,
      PVG_BDS_Type: akeneoProduct.values.PVG_BDS_Type,
      PVG_BDS_Rear_Lift_Height: akeneoProduct.values.PVG_BDS_Rear_Lift_Height,
      PVG_BDS_Rear_Lift_Method: akeneoProduct.values.PVG_BDS_Rear_Lift_Method,
      PVG_BDS_Front_Lift_Height: akeneoProduct.values.PVG_BDS_Front_Lift_Height,
      PVG_BDS_Front_Lift_Method: akeneoProduct.values.PVG_BDS_Front_Lift_Method,
      PVG_BDS_Series: akeneoProduct.values.PVG_BDS_Series,
      PVG_BDS_Adjustable: akeneoProduct.values.PVG_BDS_Adjustable,
      PVG_BDS_Adjustable_Damping: akeneoProduct.values.PVG_BDS_Adjustable_Damping,
      PVG_BDS_Lift_Height: akeneoProduct.values.PVG_BDS_Lift_Height,
      PVG_BDS_Compressed_Length: akeneoProduct.values.PVG_BDS_Compressed_Length,
      PVG_BDS_Extended_Length: akeneoProduct.values.PVG_BDS_Extended_Length,
      PVG_BDS_Travel_Length: akeneoProduct.values.PVG_BDS_Travel_Length,
      PVG_BDS_Position: akeneoProduct.values.PVG_BDS_Position,
      PVG_BDS_Maximum_Lift: akeneoProduct.values.PVG_BDS_Maximum_Lift,
      '1_tire_diameter': akeneoProduct.values["1_tire_diameter"],
      '2_tire_diameter': akeneoProduct.values["2_tire_diameter"],
      '3_tire_diameter': akeneoProduct.values["3_tire_diameter"],
    };

    const tier2_parents = [
      'BDS_Kits', 'PVG_BDS_ShocksandCoilovers', 'Suspension_Parts', 'BDS_Lifestyle', 'BDS_More'
    ];

    const productTagsArray = [];

    for (const key in productAttributes) {
      const attribute = productAttributes[key];
      if (attribute && attribute[0] && attribute[0].data !== null && attribute[0].data !== undefined) {
        if (key === 'price') {
          productTagsArray.push(attribute[0].data[0].amount);
          productTagsArray.push('Price:' + attribute[0].data[0].amount);
        } else if (key === 'stusa_brand') {
          productTagsArray.push(attribute[0].data.toUpperCase());
          productTagsArray.push('Brand:' + attribute[0].data.toUpperCase());
        } else if (key === 'PVG_BDS_Adjustable' || key === 'PVG_BDS_Adjustable_Damping' || key === 'PVG_BDS_Compressed_Length' || key === 'PVG_BDS_Extended_Length' || key === 'PVG_BDS_Travel_Length' || key === 'PVG_BDS_Maximum_Lift' || key === 'PVG_BDS_Position') {
          if (key === 'PVG_BDS_Compressed_Length' || key === 'PVG_BDS_Extended_Length' || key === 'PVG_BDS_Travel_Length' || key === 'PVG_BDS_Maximum_Lift') {
            productTagsArray.push(attribute[0].data.amount);
            productTagsArray.push(key.replace('PVG_BDS_', '').replace(/_/g, ' ') + ':' + attribute[0].data.amount);
          } else if(key === 'PVG_BDS_Adjustable' || key === 'PVG_BDS_Adjustable_Damping') {
            productTagsArray.push(attribute[0].data? 'Yes' : 'No');
            productTagsArray.push(key.replace('PVG_BDS_', '').replace(/_/g, ' ') + ':' + attribute[0].data? 'Yes' : 'No');
          } else {
            productTagsArray.push(attribute[0].data);
            productTagsArray.push(key.replace('PVG_BDS_', '').replace(/_/g, ' ') + ':' + attribute[0].data);
          }
        } else {
          const tag = (await makeRequest("GET", `${process.env.AKENEO_API_URI}attributes/${key}/options/${attribute[0].data}`, null, null, null)).labels.en_US;
          if (key !== 'PVG_BDS_Front_Lift_Method' && key !== 'PVG_BDS_Rear_Lift_Method') {
            productTagsArray.push(tag);
          }
          if (key === '1_tire_diameter' || key === '2_tire_diameter' || key === '3_tire_diameter') {
            productTagsArray.push('Max Tire Size:' + tag);
          } else {
            productTagsArray.push(key.replace('PVG_BDS_', '').replace(/_/g, ' ') + ':' + tag);
          }
        }
      }
    }

    let categories = akeneoProduct.categories;
    if (akeneoProduct.categories.includes('BDS_More') && akeneoProduct.categories.includes('Suspension_Parts')) {
      categories = akeneoProduct.categories.filter(item => item !== 'Suspension_Parts');
    }

    for(const category of categories) {
      const categoryObj = await makeRequest("GET", `${process.env.AKENEO_API_URI}categories/${category}`, null, null, null);
      if (categoryObj) {
        if (tier2_parents.includes(categoryObj.parent)) {
          productTagsArray.push('tier2:' + categoryObj.labels.en_US);
          productTagsArray.push(categoryObj.labels.en_US);
        } else {
          if (category !== 'BDS_productCategories') {
            productTagsArray.push(categoryObj.labels.en_US);
          }
        }
      }
    }

    const productTagObj = {
      [akeneoProduct.identifier]: productTagsArray.filter((item, index) => productTagsArray.indexOf(item) === index)
    };

    console.log("Tags from product attributes: " + productTagsArray);
    mergedProductsArray.push(productTagObj);
    createTagsFromFitment();
  }

  function createTagsFromFitment() {
    let productFitmentString;
    if (akeneoProduct.values.zn_fitment) {
      productFitmentString = akeneoProduct.values.zn_fitment[0].data;

      // If product has fitment string, create tags from fitment string
      const fitmentStringArr = productFitmentString.split(';');
      const fitmentTagsArray = [];
      const fitmentYearsArray = [];
      let productRecordExists = false;


      for (let i = 0; i < fitmentStringArr.length; i++) {
        const string = fitmentStringArr[i];
        const tempTags = string.split('|');


        for (let j = 0; j < tempTags.length; j++) {
          const tag = tempTags[j];
          if (tag !== 'X' && !fitmentTagsArray.includes(tag) && isNaN(Number(tag))) {
            if (tag.includes('Ram')) {
              fitmentTagsArray.push(tag.toUpperCase());
            } else {
              fitmentTagsArray.push(tag);
            }
          } else if (tag !== 'X' && !fitmentYearsArray.includes(tag) && !isNaN(Number(tag)) && j === 0) {
            fitmentYearsArray.push(tag);
          }
        };
      };

      const yearRange = fitmentYearsArray.length > 1 ? createYearRangeTag(fitmentYearsArray) : fitmentYearsArray[0] ?? 'No Year';

      if (!fitmentTagsArray.includes(yearRange)) {
        fitmentTagsArray.push(yearRange);
      }

      const productTagObj = {
        [akeneoProduct.identifier]: fitmentTagsArray.filter((item, index) => fitmentTagsArray.indexOf(item) === index)
      };


      for (const [key, product] of Object.entries(mergedProductsArray)) {
        if (product[akeneoProduct.identifier]) {
          for (let i = 0; i < productTagObj[akeneoProduct.identifier].length; i++) {
            const tag = productTagObj[akeneoProduct.identifier][i];
            if (tag) {
              mergedProductsArray[key][akeneoProduct.identifier].push(tag);
            }
          };
          productRecordExists = true;
          return;
        }
      };

      if (!productRecordExists) {
        mergedProductsArray.push(productTagObj);
      }

      // await saveTagsToDb();
    }
  }

  function createYearRangeTag(years) {
    console.log("This is the years array: ", years);
    let range_started = 0;
    const ranges = [];
    const last_year = years[years.length - 1];
    let next_expected = 0;

    for (let i = 0; i < years.length; i++) {
      const year = parseInt(years[i], 10);
      if (!range_started) {
        range_started = year;
        next_expected = year + 1;
        continue;
      }

      if (year === next_expected) {
        next_expected++;

        if (year < last_year) {
          continue;
        }
      }

      const ne = next_expected - 1;

      if (range_started < ne)
        ranges.push(range_started + '-' + ne);
      else
        ranges.push(range_started);

      range_started = year;
      next_expected = year + 1;
    };

    // Handle the last range
    if (range_started < last_year)
      ranges.push(range_started + '-' + last_year);
    else
      ranges.push(range_started);

    console.log("This is the ranges array: ", ranges[0])
    return ranges[0];
  }

  await createTagsFromProductAttributes();

  return mergedProductsArray;
}

async function createProductModelTags(akeneoProduct, akeneoVariants) {
  const mergedProductsArray = [];

  async function createTagsFromProductAttributes() {
    const productAttributes = {
      price: akeneoProduct.values.price,
      stusa_brand: akeneoProduct.values.stusa_brand,
      PVG_BDS_Type: akeneoProduct.values.PVG_BDS_Type,
      PVG_BDS_Rear_Lift_Height: akeneoProduct.values.PVG_BDS_Rear_Lift_Height,
      PVG_BDS_Rear_Lift_Method: akeneoProduct.values.PVG_BDS_Rear_Lift_Method,
      PVG_BDS_Front_Lift_Height: akeneoProduct.values.PVG_BDS_Front_Lift_Height,
      PVG_BDS_Front_Lift_Method: akeneoProduct.values.PVG_BDS_Front_Lift_Method,
      PVG_BDS_Series: akeneoProduct.values.PVG_BDS_Series,
      PVG_BDS_Adjustable: akeneoProduct.values.PVG_BDS_Adjustable,
      PVG_BDS_Adjustable_Damping: akeneoProduct.values.PVG_BDS_Adjustable_Damping,
      PVG_BDS_Lift_Height: akeneoProduct.values.PVG_BDS_Lift_Height,
      PVG_BDS_Compressed_Length: akeneoProduct.values.PVG_BDS_Compressed_Length,
      PVG_BDS_Extended_Length: akeneoProduct.values.PVG_BDS_Extended_Length,
      PVG_BDS_Travel_Length: akeneoProduct.values.PVG_BDS_Travel_Length,
      PVG_BDS_Position: akeneoProduct.values.PVG_BDS_Position,
      PVG_BDS_Maximum_Lift: akeneoProduct.values.PVG_BDS_Maximum_Lift,
      categories: akeneoProduct.categories,
      '1_tire_diameter': akeneoProduct.values["1_tire_diameter"],
      '2_tire_diameter': akeneoProduct.values["2_tire_diameter"],
      '3_tire_diameter': akeneoProduct.values["3_tire_diameter"],
    };

    const tier2_parents = [
      'BDS_Kits', 'PVG_BDS_ShocksandCoilovers', 'Suspension_Parts', 'BDS_Lifestyle', 'BDS_More'
    ];

    const productTagsArray = [];

    for (const key in productAttributes) {
      const attribute = productAttributes[key];
      if (attribute && attribute[0] && attribute[0].data !== null && attribute[0].data !== undefined) {
        if (key === 'price') {
          productTagsArray.push(attribute[0].data[0].amount);
          productTagsArray.push('Price:' + attribute[0].data[0].amount);
        } else if (key === 'stusa_brand') {
          productTagsArray.push(attribute[0].data.toUpperCase());
          productTagsArray.push('Brand:' + attribute[0].data.toUpperCase());
        } else if (key === 'PVG_BDS_Adjustable' || key === 'PVG_BDS_Adjustable_Damping' || key === 'PVG_BDS_Compressed_Length' || key === 'PVG_BDS_Extended_Length' || key === 'PVG_BDS_Travel_Length' || key === 'PVG_BDS_Maximum_Lift' || key === 'PVG_BDS_Position') {
          if (key === 'PVG_BDS_Compressed_Length' || key === 'PVG_BDS_Extended_Length' || key === 'PVG_BDS_Travel_Length' || key === 'PVG_BDS_Maximum_Lift') {
            productTagsArray.push(attribute[0].data.amount);
            productTagsArray.push(key.replace('PVG_BDS_', '').replace(/_/g, ' ') + ':' + attribute[0].data.amount);
          } else if(key === 'PVG_BDS_Adjustable' || key === 'PVG_BDS_Adjustable_Damping') {
            productTagsArray.push(attribute[0].data? 'Yes' : 'No');
            productTagsArray.push(key.replace('PVG_BDS_', '').replace(/_/g, ' ') + ':' + attribute[0].data? 'Yes' : 'No');
          } else {
            productTagsArray.push(attribute[0].data);
            productTagsArray.push(key.replace('PVG_BDS_', '').replace(/_/g, ' ') + ':' + attribute[0].data);
          }
        } else {
          const tag = (await makeRequest("GET", `${process.env.AKENEO_API_URI}attributes/${key}/options/${attribute[0].data}`, null, null, null)).labels.en_US;
          if (key !== 'PVG_BDS_Front_Lift_Method' && key !== 'PVG_BDS_Rear_Lift_Method') {
            productTagsArray.push(tag);
          }
          if (key === '1_tire_diameter' || key === '2_tire_diameter' || key === '3_tire_diameter') {
            productTagsArray.push('Max Tire Size:' + tag);
          } else {
            productTagsArray.push(key.replace('PVG_BDS_', '').replace(/_/g, ' ') + ':' + tag);
          }
        }
      }
    }

    let categories = akeneoProduct.categories;
    if (akeneoProduct.categories.includes('BDS_More') && akeneoProduct.categories.includes('Suspension_Parts')) {
      categories = akeneoProduct.categories.filter(item => item !== 'Suspension_Parts');
    }

    for(const category of categories) {
      const categoryObj = await makeRequest("GET", `${process.env.AKENEO_API_URI}categories/${category}`, null, null, null);
      if (categoryObj) {
        if (tier2_parents.includes(categoryObj.parent)) {
          productTagsArray.push('tier2:' + categoryObj.labels.en_US);
          productTagsArray.push(categoryObj.labels.en_US);
        } else {
          if (category !== 'BDS_productCategories') {
            productTagsArray.push(categoryObj.labels.en_US);
          }
        }
      }
    }

    // Add part-number tag for search
    for (const variant of akeneoVariants) {
      const partNumber = variant.identifier.replace('BDS', '');
      productTagsArray.push(partNumber);
    }

    const productTagObj = {
      [akeneoProduct.code]: productTagsArray.filter((item, index) => productTagsArray.indexOf(item) === index)
    };

    mergedProductsArray.push(productTagObj);
    createTagsFromFitment();
  }

  function createTagsFromFitment() {
    let productFitmentString;
    if (akeneoProduct.values.zn_fitment) {
      productFitmentString = akeneoProduct.values.zn_fitment[0].data;

      // If product has fitment string, create tags from fitment string
      const fitmentStringArr = productFitmentString.split(';');
      const fitmentTagsArray = [];
      const fitmentYearsArray = [];
      let productRecordExists = false;


      for (let i = 0; i < fitmentStringArr.length; i++) {
        const string = fitmentStringArr[i];
        const tempTags = string.split('|');

        for (let j = 0; j < tempTags.length; j++) {
          const tag = tempTags[j];
          if (tag !== 'X' && !fitmentTagsArray.includes(tag) && isNaN(Number(tag))) {
            if (tag.includes('Ram')) {
              fitmentTagsArray.push(tag.toUpperCase());
            } else {
              fitmentTagsArray.push(tag);
            }
          } else if (tag !== 'X' && !fitmentYearsArray.includes(tag) && !isNaN(Number(tag)) && j === 0) {
            fitmentYearsArray.push(tag);
          }
        };
      };

      const yearRange = fitmentYearsArray.length > 1 ? createYearRangeTag(fitmentYearsArray) : fitmentYearsArray[0] ?? 'No Year';

      if (!fitmentTagsArray.includes(yearRange)) {
        fitmentTagsArray.push(yearRange);
      }

      const productTagObj = {
        [akeneoProduct.code]: fitmentTagsArray.filter((item, index) => fitmentTagsArray.indexOf(item) === index)
      };


      for (const [key, product] of Object.entries(mergedProductsArray)) {
        if (product[akeneoProduct.code]) {
          for (let i = 0; i < productTagObj[akeneoProduct.code].length; i++) {
            const tag = productTagObj[akeneoProduct.code][i];
            if (tag) {
              mergedProductsArray[key][akeneoProduct.code].push(tag);
            }
          };
          productRecordExists = true;
          return;
        }
      };

      if (!productRecordExists) {
        mergedProductsArray.push(productTagObj);
      }

      // await saveTagsToDb();
    }
  }

  function createYearRangeTag(years) {
    let range_started = 0;
    const ranges = [];
    const last_year = years[years.length - 1];
    let next_expected = 0;

    for (let i = 0; i < years.length; i++) {
      const year = parseInt(years[i], 10);
      if (!range_started) {
        range_started = year;
        next_expected = year + 1;
        continue;
      }

      if (year === next_expected) {
        next_expected++;

        if (year < last_year) {
          continue;
        }
      }

      const ne = next_expected - 1;

      if (range_started < ne)
        ranges.push(range_started + '-' + ne);
      else
        ranges.push(range_started);

      range_started = year;
      next_expected = year + 1;
    };

    // Handle the last range
    if (range_started < last_year)
      ranges.push(range_started + '-' + last_year);
    else
      ranges.push(range_started);

    return ranges[0];
  }

  await createTagsFromProductAttributes();

  return mergedProductsArray;
}

// Export module
module.exports = {
  createProductTags,
  createProductModelTags
};