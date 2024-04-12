const YmmVehicle = require('../../models/Misc/YmmVehicle');
const FitmentString = require('../../models/Misc/FitmentStringGeneral');

const { getAllYears, getMakes, getModels, getSubmodels, getDriveTypes, getFuelTypes, getDoors, getVehicleType } = require('./YmmHelpers');

const handleQuery = async (req) => {
    let response = {
        "filters": [req.body],
        "result": {}
    };

    switch (Object.keys(req.body).length) {
        case 0:
            response["result"] = { "year": await getAllYears() };
            break;
        case 1:
            response["result"] = { "make": await getMakes(req.body.year) };
            break;
        case 2:
            response["result"] = { "model": await getModels(req.body.year, req.body.make) };
            break;
        case 3:
            response["result"] = { "submodel": await getSubmodels(req.body.year, req.body.make, req.body.model) };
            break;
        case 4:
            response["result"] = { "drive_type": await getDriveTypes(req.body.year, req.body.make, req.body.model, req.body.submodel) };
            break;
        case 5:
            response["result"] = { "fuel_type": await getFuelTypes(req.body.year, req.body.make, req.body.model, req.body.submodel, req.body.drive_type) };
            break;
        case 6:
            response["result"] = { "doors": await getDoors(req.body.year, req.body.make, req.body.model, req.body.submodel, req.body.drive_type, req.body.fuel_type) };
            break;
        case 7:
            response["result"] = { "type": await getVehicleType(req.body.year, req.body.make, req.body.model, req.body.submodel, req.body.drive_type, req.body.fuel_type, req.body.doors) };
            break;
        case 8:
            response["result"] = { "end": "end" };
            break;
        default:
            break;
    }

    return response;
}

const populateYmmCollection = async (req) => {
    console.log('Populating YmmVehicle collection...');
    try {
        const fitmentStrings = await FitmentString.find();
        //const ymmRecords = await YmmVehicle.find();
        const ymmVehicleArray = [];

        for (let stringGroup of fitmentStrings) {
            let fitmentStringArr = stringGroup.fitment_string_data.split(';');
    
            for (let string of fitmentStringArr) {
                let stringArray = string.split('|');
    
                let ymmVehicleObj = new YmmVehicle({
                    year: stringArray[0] || 'X',
                    make: stringArray[1] || 'X',
                    model: stringArray[2] || 'X',
                    sub_model: stringArray[3] || 'X',
                    drive_type: stringArray[4] || 'X',
                    fuel_type: stringArray[5] || 'X',
                    doors: stringArray[6] || 'X',
                    type: stringArray[7] || 'X',
                });

                ymmVehicleArray.push(ymmVehicleObj);

                // if (ymmRecords.length > 1) {
                //     await YmmVehicle.findOneAndUpdate({ _id: req.params.id }, {
                //         year: fitmentObj.year,
                //         make: fitmentObj.make,
                //         model: fitmentObj.model,
                //         submodel: fitmentObj.sub_model,
                //         drive_type: fitmentObj.drive_type,
                //         fuel_type: fitmentObj.fuel_type,
                //         doors: fitmentObj.doors,
                //         type: fitmentObj.body_type,
                //     });
                // } else {
                //     await fitmentObj.save();
                // }
            }
        }

        // Send the array of objects to the database
        await YmmVehicle.create(ymmVehicleArray);
        console.log('YmmVehicle collection populated.');
    } catch (err) {
        console.log(err);
    }
}

module.exports = {
    handleQuery,
    populateYmmCollection
}