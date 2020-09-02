module.exports = async function(msg,config,storage,RED) {
    function Sleep(milliseconds) {
     return new Promise(resolve => setTimeout(resolve, milliseconds));
    }

    if(typeof config.source == 'undefined') {
        config.source = "./discovergy.js";
    }
    const source = require(config.source);

    const axios = require("axios");
    let node = {};

    if(((typeof config.username == 'undefined') || (config.username == null)) && (typeof RED !== 'undefined')) {
      node.config = RED.nodes.getNode(config.account);
    } else {
      node.config = config;
      node.config.credentials = {
          username: config.username,
          password: config.password
      };
    }
    await Sleep(300);
    // Set Demo Account if data configured
    if((typeof node.config.credentials.username == 'undefined') || (node.config.credentials.username == null) || (node.config.credentials.username.length < 3)) {
      node.config.credentials.username = "demo@corrently.de";
      node.config.credentials.password = "aNPR66nGXQhZ";
    }
      let doaggregation = false;
      if(typeof msg.payload.latest !== 'undefined') {
        aggregation = msg.payload;
        doaggregation = true;
      }

      let meterinfo = storage.get("meterinfo_"+config.meterId);
      if((typeof meterinfo === "undefined") || ( meterinfo === null)) {
          const correntlyInfo = require("./corrently.js");
          meterinfo = await correntlyInfo(node,storage,config);
      }
      if((typeof config.firstReadingDate !== 'undefined')&&(config.firstReadingDate !== null)&&((''+config.firstReadingDate).length>6)) {
        meterinfo.firstMeasurementTime = new Date(config.firstReadingDate);
      }

      let responds = {};
      try {
        responds = await source.last_reading(config.meterId,node);
      } catch(e) {
        console.warn("API Request failed for meterId: "+config.meterId);
        throw Error(e);
      }
      if(config.isProduction) {
        let out = responds.values.energy;
        responds.values.energy = responds.values.energyOut;
        responds.values.energyOut = out;
      }
      let productionData = {};
      if((typeof config.prodMeterId !== 'undefined')&&(config.prodMeterId.length > 10)) {
        productionData = await source.last_reading(config.prodMeterId,node);
      }
      const decoratorModule = require("./decorator.js");
      msg.payload = await decoratorModule( responds,meterinfo,config,productionData);
      if(msg.topic == "writeconfig") {
        const fs = require("fs");
        fs.writeFileSync("./config.json",JSON.stringify(config));
      }
      if(msg.topic == "statistics") {
        const statsModule = require("./stats.js");
        msg.payload = await statsModule( msg.payload,config,node.config,meterinfo,storage);
      }
      if(doaggregation) {
          const aggregationModule = require("./aggregation.js");
          msg.payload = await aggregationModule( msg.payload,aggregation);
      }
      return msg.payload;
};
