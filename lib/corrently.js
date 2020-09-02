module.exports = async function(node,storage,config) {
  const axios = require("axios");
  if(typeof config.source == 'undefined') {
      config.source = "./discovergy.js";
  }
  const source = require(config.source);
  let meterinfo = {};

  let meters = await source.meters(node);

  for(let i=0;i<meters.length;i++) {
      if(meters[i].meterId === config.meterId) {

        if((typeof meters[i].location !== "undefined") && (typeof meters[i].location.zip !== "undefined") && (typeof meters[i].location.country !== "undefined")) {
            if(meters[i].location.country === "DE") {
                let tinfo = await axios.get("https://api.corrently.io/core/tarif?zip="+ meters[i].location.zip);
                tinfo = tinfo.data;
                meters[i].energyPriceWh = (tinfo[0].ap/100000);
                meters[i].yearlyBasePrice = (tinfo[0].gp*12);
            }
        }
        storage.set("meterinfo_"+config.meterId,meters[i]);
        meterinfo = meters[i];
      }
  }
  return meterinfo;
};
