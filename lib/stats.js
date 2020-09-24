module.exports = async function(payload,config,nodeconfig,meterinfo,storage) {
  function Sleep(milliseconds) {
   return new Promise(resolve => setTimeout(resolve, milliseconds));
 }

  const fetchTimeFrame = require("./stats_request.js");
  const community = require("./community.js");
  const axios = require("axios");

  if(typeof config.depot !== 'undefined') {
    payload.depot = storage.get("depot");
    if((typeof payload.depot == "undefined")||(payload.depot.timeStamp==null)||(payload.depot.timeStamp < new Date().getTime() - (3600000*6))) {
        const cprod = require("./corrently_production.js");
        payload.depot = await cprod(config);
        payload.depot.updated = new Date().getTime();
        let j=0;
        for(let i=0;i<payload.depot.assets.length;i++) {
          j += payload.depot.assets[i].shares;
        }
        payload.depot.cnt = j;
        storage.set("depot",payload.depot);
    }
  } else {
    payload.depot = { cnt:0 };
  }
  meterinfo.correntlycnt = payload.depot.cnt;

  if(typeof payload.stats == 'undefined') payload.stats = {};

  try {
          const retrieveAndSet = async function(statname,nodeconfig,config,meterinfo,resolution,from,to) {
            if(typeof payload.stats[statname] !== 'undefined') {
              if(typeof payload.stats[statname].energyPrice_kwh !== 'undefined') {
                if(typeof payload.stats[statname].energyPrice_kwh_trend == 'undefined') {
                  payload.stats[statname].energyPrice_kwh_trend = payload.stats[statname].energyPrice_kwh;
                } else {
                  payload.stats[statname].energyPrice_kwh_trend = ((3*payload.stats[statname].energyPrice_kwh_trend) + payload.stats[statname].energyPrice_kwh)/4;
                }
              }
            }
            payload.stats[statname] = await fetchTimeFrame(nodeconfig,config,meterinfo,resolution,from,to);
            if(typeof payload.stats[statname] != 'undefined') {
              payload.stats[statname].updated = new Date().getTime();
            }
            storage.set(statname,payload.stats[statname]);
            await Sleep(100); // Delay to get DGY Api settled
            return;
          };
      let to = payload.time;
      let from = payload.time - (24* 3600000);
      payload.stats.last24h = await fetchTimeFrame(nodeconfig,config,meterinfo,'fifteen_minutes',from,to);
      await Sleep(50); // Delay to get DGY Api settled
      to = payload.time;
      from = payload.time - (1* 3600000);
      payload.stats.last1h = await fetchTimeFrame(nodeconfig,config,meterinfo,'three_minutes',from,to);
      await Sleep(50); // Delay to get DGY Api settled
      payload.stats.last7d = storage.get("last7d");
      if((typeof payload.stats.last7d == "undefined")||(payload.stats.last7d.updated==null)||(payload.stats.last7d.updated < new Date().getTime() - (900000*1))) {
          to = payload.time;
          from =  to - (7*86400000);
          await retrieveAndSet('last7d',nodeconfig,config,meterinfo,'fifteen_minutes',from,to);
      }
      payload.stats.last30d = storage.get("last30d");
      if((typeof payload.stats.last30d == "undefined")||(payload.stats.last30d.updated==null)||(payload.stats.last30d.updated < new Date().getTime() - (900000*1))) {
          to = payload.time;
          from =  to - (30*86400000);
          await retrieveAndSet('last30d',nodeconfig,config,meterinfo,'fifteen_minutes',from,to);
      }

      payload.stats.last365d = storage.get("last365d");
      if((typeof payload.stats.last365d == "undefined")||(payload.stats.last365d.updated==null)||(payload.stats.last365d.updated < new Date().getTime() - (3600000*2))) {
            to = payload.time;
            d = new Date(new Date(to).setHours(0,0,0,0));
            from =   payload.time - (365*86400000);
            await retrieveAndSet('last365d',nodeconfig,config,meterinfo,'one_day',from,to);
      }

      if((typeof config.uuid !== 'undefined') && (typeof config.community !== 'undefined')) {
        await community(payload,storage,config);
      }
      if(typeof payload.stats.last7d.energy == 'undefined') delete payload.stats.last7d;
      if(typeof payload.stats.last30d.energy == 'undefined') delete payload.stats.last30d;
      if(typeof payload.stats.last365d.energy == 'undefined') delete payload.stats.last365d;

      payload.stats.gsi = storage.get("gsi");
      if((typeof payload.stats.gsi == "undefined")||(payload.stats.gsi.updated==null)||(payload.stats.gsi.updated < new Date().getTime() - (900000*1))) {
          if((typeof meterinfo.location !== 'undefined') && (typeof meterinfo.location.zip !== 'undefined')) {
            payload.stats.gsi = await axios.get("https://api.corrently.io/core/gsi?zip="+meterinfo.location.zip);
            delete payload.stats.gsi.matrix;
            storage.set("gsi",payload.stats.gsi);
          }
      }
    } catch(e) {
      if(typeof config._logger !== 'undefined') {
        config._logger.warn("Error retrieving Statistics from Underlaying API",e);
      }
      throw Error(e);
    }
    return payload;
};
