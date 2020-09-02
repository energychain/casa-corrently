module.exports = async function(config) {
  const axios = require("axios");

  let meterinfo = {};
  if(typeof config.depot == "undefined") {
    return 0;
  } else {
    let depot = await axios.get("https://api.corrently.io/core/depot?account="+config.depot);
    return depot.data;
  }
};
