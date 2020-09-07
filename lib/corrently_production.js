module.exports = async function(config) {
  const axios = require("axios");

  let meterinfo = {};
  if(typeof config.depot == "undefined") {
    if(typeof config._logger !== 'undefined') {
        config._logger.warn("Depot is undefined");
    }
    return 0;
  } else {
    try {
    let depot = await axios.get("https://api.corrently.io/core/depot?account="+config.depot);
    return depot.data;
    } catch(e) {
      if(typeof config._logger !== 'undefined') {
          config._logger.warn("Failed to retrieve depot via ","https://api.corrently.io/core/depot?account="+config.depot);
      }
      return 0;
    }
  }
};
