module.exports = async function(msg,config,storage,RED,statsoffset) {
    const crypto = require("crypto");
    const os = require('os');

    function Sleep(milliseconds) {
     return new Promise(resolve => setTimeout(resolve, milliseconds));
    }
    if(config.meterId.indexOf(',') > -1) {
      config.meterId = config.meterId.split(',');
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
    await Sleep(100);
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
      meterinfo.firstMeasurementTime = new Date(meterinfo.firstMeasurementTime).getTime();
      
      let responds = {};
      if(typeof config._logger !== 'undefined') {
          config._logger.debug("Retrieve Readings for "+config.meterId);
      }

      try {
        responds = await source.last_reading(config.meterId,node);
        if((statsoffset !== null)&&(typeof statsoffset !== 'undefined')) {
          responds.time -= statsoffset;
        }
      } catch(e) {
        if(typeof config._logger !== 'undefined') {
          config._logger.warn("API Request failed for meterId: "+config.meterId);
        }
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
        try{
          msg.payload = await statsModule( msg.payload,config,node.config,meterinfo,storage);
        } catch(e) {
          if(typeof config._logger !== 'undefined') {
              config._logger.error("Empty history requested");
          }
          return msg.payload;
        }
      }
      if(doaggregation) {
          const aggregationModule = require("./aggregation.js");
          msg.payload = await aggregationModule( msg.payload,aggregation);
      }
      if(typeof config.name !== 'undefined') {
        msg.payload.name = config.name;
      }
      msg.payload.uuid = config.uuid;

      let system_fp = os.cpus()[0].model + os.totalmem() + config.uuid; //TODO: Make it better
      let config_fp = JSON.stringify(msg.payload.meterinfo);
      msg.payload.fingerprint = {
        config: crypto.createHash('sha256').update(config_fp).digest('base64'),
        system: crypto.createHash('sha256').update(system_fp).digest('base64')
      }
      return msg.payload;
};
