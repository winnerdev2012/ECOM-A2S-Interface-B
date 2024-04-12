async function createProductTags(akeneoProduct) {
        const mergedProductsArray = [];

        function createTagsFromProductAttributes() {
            console.log("Creating tags from product attributes...")
            const productAttributes = {
              zn_liftType: akeneoProduct.values.zn_liftType,
              zn_maxTireSize_1: akeneoProduct.values.zn_maxTireSize_1,
              zn_maxTireSize_2: akeneoProduct.values.zn_maxTireSize_2,
              zn_maxTireSize_3: akeneoProduct.values.zn_maxTireSize_3,
              zn_liftHeight_rear: akeneoProduct.values.zn_liftHeight_rear,
              zn_liftMethod_rear: akeneoProduct.values.zn_liftMethod_rear,
              zn_liftHeight_front: akeneoProduct.values.zn_liftHeight_front,
              zn_liftMethod_front: akeneoProduct.values.zn_liftMethod_front,
              zn_requiresFitment: akeneoProduct.values.zn_requiresFitment,
              zn_boxItems: akeneoProduct.values.zn_boxItems,
              jks_Product_Type_II: akeneoProduct.values.jks_Product_Type_II, 
              PVG_Harmonization_Code: akeneoProduct.values.PVG_Harmonization_Code,
              categories: akeneoProduct.categories,
            };
          
            const productTagsArray = [];
          
            for (const key in productAttributes) {
              const attribute = productAttributes[key];
              if (attribute && attribute[0] && attribute[0].data !== null && attribute[0].data !== undefined) {

                // Specific transformations here

                // The switch statement below is for the products values attributes
                switch (key) {
                    case 'zn_requiresFitment':
                      if (attribute[0].data === true) {
                        productTagsArray.push('Requires Fitment');
                      }
                      break;
            
                    case 'jks_Product_Type_II':
                      if (attribute.length) {
                        // Replace underscore with space and capitalize first letter of each word for attribute[0].data[0]
                        const jksProductType = attribute[0].data[0].replace(/_/g, ' ').replace(/\w\S*/g, (w) => (w.replace(/^\w/, (c) => c.toUpperCase())));
                        productTagsArray.push(jksProductType);
                      }
                      break;
                    // Lift height
                   case 'zn_liftHeight_front':
                    if (attribute[0].data) {
                        const liftHeight = `${attribute[0].data}` + '"';
                        productTagsArray.push(liftHeight);
                    }
                    break;
                   // Max tire size
                   case 'zn_maxTireSize_1':
                    if (attribute[0].data) {
                        const maxTireSize = attribute[0].data;
                        let maxTireFormatted = maxTireSize.replace(/__/g, "x").replace(/_1_2$/, ".5");
                
                        console.log("Max tire size: " + maxTireFormatted)
                        productTagsArray.push(maxTireFormatted.toString());
                    }
                    break;
            
                    default:
                      break;
                  }
                  // Check for categories
              } else if(key === 'categories') {
                console.log("This is the categories check...")
                for (let i = 0; i < attribute.length; i++) {
                    const category = attribute[i];
                    const regex = /^zn_(kits|merchandise|parts)_(.+)/i;
                    const match = category.match(regex);
                
                    if (match) {
                      const keywordTag = match[1].charAt(0).toUpperCase() + match[1].slice(1);
                      if (!productTagsArray.includes(keywordTag)) {
                        productTagsArray.push(keywordTag);
                      }
                
                      const remainingStr = match[2];
                      const words = remainingStr.split(/_/);
                
                      for (let j = 0; j < words.length; j++) {
                        const currentWord = words[j].replace(/([A-Z])/g, ' $1').trim();
                        const capitalizedWord = currentWord.charAt(0).toUpperCase() + currentWord.slice(1);
                
                        if (!productTagsArray.includes(capitalizedWord)) {
                          productTagsArray.push(capitalizedWord);
                        }
                      }
                    }
                  }
              }
            }
          
            const productTagObj = {
              [akeneoProduct.identifier]: productTagsArray
            };
          
            console.log("Tags from product attributes: " + productTagsArray)
            mergedProductsArray.push(productTagObj);
            createTagsFromFitment();
          }
          
    function createTagsFromFitment() {
        
        let productFitmentString;
        if(akeneoProduct.values.zn_fitment) {
            productFitmentString = akeneoProduct.values.zn_fitment[0].data;

        // If product has fitment string, create tags from fitment string
            const fitmentStringArr = productFitmentString.split(';');
            const fitmentTagsArray = [];
            const fitmentYearsArray = [];
            let productRecordExists = false;

          
            for(let i = 0; i < fitmentStringArr.length; i++) {
                const string = fitmentStringArr[i];
                const tempTags = string.split('|');

                
                for(let j = 0; j < tempTags.length; j++) {
                    const tag = tempTags[j];
                    if (tag !== 'X' && !fitmentTagsArray.includes(tag) && isNaN(Number(tag))) {
                        if(tag.includes('Ram')) {
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
                [akeneoProduct.identifier]: fitmentTagsArray,
            };

            
            for(const [key, product] of Object.entries(mergedProductsArray)) {
                if (product[akeneoProduct.identifier]) {
                    for(let i = 0; i < productTagObj[akeneoProduct.identifier].length; i++) {    
                        const tag = productTagObj[akeneoProduct.identifier][i];
                        if(tag) {
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
        console.log("This is the years array: ", years)
        let range_started = 0;
        const ranges = [];
        const last_year = years[years.length - 1];
        let next_expected = 0;
    
        for(let i = 0; i < years.length; i++) {
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

    createTagsFromProductAttributes();

    return mergedProductsArray;
}

// Export module
module.exports = {
    createProductTags,
};


