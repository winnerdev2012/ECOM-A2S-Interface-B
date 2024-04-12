const YmmVehicle = require('../../models/Misc/YmmVehicle');
// const { redisClient } = require('../../config/redis');

// // Put all YmmVehicle documents into Redis
// async function populateRedis () {
//   // Check if Redis has allVehicles key
//   let allVehicles = await redisClient.get('allVehicles');

//   if(allVehicles.length > 0) {
//     return;
//   }

//   try {
//     const allVehicles = await YmmVehicle.find();
//     const vehicleArray = [];

//     for (const vehicle of allVehicles) {
//       vehicleArray.push(JSON.stringify(vehicle));
//     }

//     redisClient.set('allVehicles', JSON.stringify(vehicleArray));
//   } catch (error) {
//     console.log(error);
//   }
// }

const getAllYears = async () => {
  try {
    const allVehicles = await YmmVehicle.find();
    let yearsOnly = [];

    for (const vehicle of allVehicles) {
      if (!yearsOnly.includes(vehicle.year)) {
        yearsOnly.push(parseInt(vehicle.year));
      }
    }

    yearsOnly.sort();

    return yearsOnly;
  } catch (error) {
    console.log(error);
  }
}

const getMakes = async (year) => {
  try {
    const vehiclesByYear = await YmmVehicle.find({ year });
    let makesOnly = [];

    for (const vehicle of vehiclesByYear) {
      if (!makesOnly.includes(vehicle.make)) {
        makesOnly.push(vehicle.make);
      }
    }

    makesOnly.sort();

    return makesOnly;
  } catch (error) {
    console.log(error);
  }
}

const getModels = async (year, make) => {
  try {
    const query = [{ year: year }, { make: make }];
    const vehiclesByModel = await YmmVehicle.find({ $and: query });
    let modelsOnly = [];

    for (const vehicle of vehiclesByModel) {
      if (!modelsOnly.includes(vehicle.model)) {
        modelsOnly.push(vehicle.model);
      }
    }

    modelsOnly.sort();

    return modelsOnly;
  } catch (error) {
    console.log(error);
  }
}

const getSubmodels = async (year, make, model) => {
  try {
    const query = [{ year: year }, { make: make }, { model: model }];
    const vehiclesByModel = await YmmVehicle.find({ $and: query });
    let submodelsOnly = [];

    for (const vehicle of vehiclesByModel) {
      if (!submodelsOnly.includes(vehicle.submodel)) {
        submodelsOnly.push(vehicle.submodel);
      }
    }

    submodelsOnly.sort();

    return submodelsOnly;
  } catch (error) {
    console.log(error);
  }
}

const getDriveTypes = async (year, make, model, submodel) => {
  try {
    const query = [{ year: year }, { make: make }, { model: model }, { submodel: submodel }];
    const vehiclesByModel = await YmmVehicle.find({ $and: query });
    let driveTypesOnly = [];

    for (const vehicle of vehiclesByModel) {
      if (!driveTypesOnly.includes(vehicle.drive_type)) {
        driveTypesOnly.push(vehicle.drive_type);
      }
    }

    driveTypesOnly.sort();

    return driveTypesOnly;
  } catch (error) {
    console.log(error);
  }
}

const getFuelTypes = async (year, make, model, submodel, drive_type) => {
  try {
    const query = [{ year: year }, { make: make }, { model: model }, { submodel: submodel }, { drive_type: drive_type }];
    const vehiclesByModel = await YmmVehicle.find({ $and: query });
    let fuelTypesOnly = [];

    for (const vehicle of vehiclesByModel) {
      if (!fuelTypesOnly.includes(vehicle.fuel_type)) {
        fuelTypesOnly.push(vehicle.fuel_type);
      }
    }

    fuelTypesOnly.sort();

    return fuelTypesOnly;
  } catch (error) {
    console.log(error);
  }
}

const getDoors = async (year, make, model, submodel, drive_type, fuel_type) => {
  try {
    const query = [{ year: year }, { make: make }, { model: model }, { submodel: submodel }, { drive_type: drive_type }, { fuel_type: fuel_type }];
    const vehiclesByModel = await YmmVehicle.find({ $and: query });
    let doorsOnly = [];

    for (const vehicle of vehiclesByModel) {
      if (!doorsOnly.includes(vehicle.doors)) {
        doorsOnly.push(vehicle.doors);
      }
    }

    doorsOnly.sort();

    return doorsOnly;
  } catch (error) {
    console.log(error);
  }
}

const getVehicleType = async (year, make, model, submodel, drive_type, fuel_type, doors) => {
  try {
    const query = [{ year: year }, { make: make }, { model: model }, { submodel: submodel }, { drive_type }, { fuel_type }, { doors }];
    const vehiclesByModel = await YmmVehicle.find({ $and: query });
    let vehicleTypeOnly = [];

    for (const vehicle of vehiclesByModel) {
      if (!vehicleTypeOnly.includes(vehicle.type)) {
        vehicleTypeOnly.push(vehicle.type);
      }
    }

    vehicleTypeOnly.sort();

    return vehicleTypeOnly;
  } catch (error) {
    console.log(error);
  }
}

const generateYmmTable = async () => {
  try {
    const fitmentStrings = await FitmentString.find();
    const ymmRecords = await YmmVehicle.find();
    const fitmentStringObjArray = [];

    if (fitmentStrings.length >= 1) {
      for (const stringGroup of fitmentStrings) {
        const fitmentStringArr = [];

        fitmentStringArr = stringGroup.fitment_string_data.split(';');

        for (const string of fitmentStringArr) {
          const stringArray = string.split('|');

          const fitmentObj = {
            year: stringArray[0] ?? 'X',
            make: stringArray[1] ?? 'X',
            model: stringArray[2] ?? 'X',
            sub_model: stringArray[3] ?? 'X',
            drive_type: stringArray[4] ?? 'X',
            fuel_type: stringArray[5] ?? 'X',
            doors: stringArray[6] ?? 'X',
            body_type: stringArray[7] ?? 'X',
            position: stringArray[8] ?? 'X',
            lift_height: stringArray[9] ?? 'X',
            quantity: stringArray[10] ?? 'X',
          };

          if (ymmRecords.length > 1) {
            YmmVehicle.updateOne({
              year: fitmentObj.year,
              make: fitmentObj.make,
              model: fitmentObj.model,
              submodel: fitmentObj.sub_model,
              drive_type: fitmentObj.drive_type,
              fuel_type: fitmentObj.fuel_type,
              doors: fitmentObj.doors,
              type: fitmentObj.body_type,
            },
            {
              year: fitmentObj.year,
              make: fitmentObj.make,
              model: fitmentObj.model,
              submodel: fitmentObj.sub_model,
              drive_type: fitmentObj.drive_type,
              fuel_type: fitmentObj.fuel_type,
              doors: fitmentObj.doors,
              type: fitmentObj.body_type,
            });
          } else {
            YmmVehicle.create({
              year: fitmentObj.year,
              make: fitmentObj.make,
              model: fitmentObj.model,
              submodel: fitmentObj.sub_model,
              drive_type: fitmentObj.drive_type,
              fuel_type: fitmentObj.fuel_type,
              doors: fitmentObj.doors,
              type: fitmentObj.body_type,
            });
          }
        }
      }
    }
    
    return redirect('/manage/fitment-strings');
  } catch (error) {
    console.log(error);
  }
}

// Export the functions
module.exports = {
  getAllYears,
  getMakes,
  getModels,
  getSubmodels,
  getDriveTypes,
  getFuelTypes,
  getDoors,
  getVehicleType,
  generateYmmTable,
};