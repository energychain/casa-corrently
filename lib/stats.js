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
          const retrieveAndSet = async function(statname,nodeconfig,config,meterinfo,resolution,from,to,readings,prodReadings) {
            if(typeof payload.stats[statname] !== 'undefined') {
              if(typeof payload.stats[statname].energyPrice_kwh !== 'undefined') {
                if(typeof payload.stats[statname].energyPrice_kwh_trend == 'undefined') {
                  payload.stats[statname].energyPrice_kwh_trend = payload.stats[statname].energyPrice_kwh;
                } else {
                  payload.stats[statname].energyPrice_kwh_trend = ((3*payload.stats[statname].energyPrice_kwh_trend) + payload.stats[statname].energyPrice_kwh)/4;
                }
              }
            }
            payload.stats[statname] = await fetchTimeFrame(nodeconfig,config,meterinfo,resolution,from,to,readings,prodReadings);
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
      payload.stats.last90d = storage.get("last90d");
      if((typeof payload.stats.last90d == "undefined")||(payload.stats.last90d.updated==null)||(payload.stats.last90d.updated < new Date().getTime() - (900000*1))) {
          to = payload.time;
          from =  to - (90*86400000);
          await retrieveAndSet('last90d',nodeconfig,config,meterinfo,'one_hour',from,to);
      }
      payload.stats.last180d = storage.get("last180d");
      if((typeof payload.stats.last180d == "undefined")||(payload.stats.last180d.updated==null)||(payload.stats.last180d.updated < new Date().getTime() - (1800000*1))) {
          to = payload.time;
          from =  to - (180*86400000);
          await retrieveAndSet('last180d',nodeconfig,config,meterinfo,'one_day',from,to);
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
      if(typeof payload.stats.last90d.energy == 'undefined') delete payload.stats.last90d;
      if(typeof payload.stats.last180d.energy == 'undefined') delete payload.stats.last180d;
      if(typeof payload.stats.last365d.energy == 'undefined') delete payload.stats.last365d;


      payload.stats.next24h = storage.get("next24h");
      if((typeof payload.stats.next24h == "undefined")||(payload.stats.next24h.updated==null)||(payload.stats.next24h.updated < new Date().getTime() - (900000*1))) {
          if((typeof meterinfo.location !== 'undefined') && (typeof meterinfo.location.zip !== 'undefined')) {
            let gsidata = await axios.get("https://api.corrently.io/gsi/gsi?zip="+meterinfo.location.zip);
            payload.stats.gsi = gsidata.data;
            let readings = [];
            let ts = ((new Date().getTime())/1000)-86400;
            let esolar_sum_last = 0;
            for(let i = payload.stats.gsi.history.length-1;((i>0)&&(payload.stats.gsi.history[i].epochtime > ts));i--) {
                esolar_sum_last += payload.stats.gsi.history[i].esolar;
            }
            ts = ((new Date().getTime())/1000)+86400;
            let esolar_sum_next = 0;
            for(let i=0;((i<payload.stats.gsi.periods.length)&&(payload.stats.gsi.periods[i].epochtime<ts));i++) {
                esolar_sum_next += payload.stats.gsi.periods[i].esolar;
            }
            let energyProd = 0;
            let efactor = 1;
            let escale = 1;
            let esolarwh = 0;

            if(esolar_sum_last!=0) {
              efactor = esolar_sum_next / esolar_sum_last;
              energyProd = Math.round(payload.stats.last24h.energyProd * efactor);
              esolarwh = Math.round(payload.stats.last24h.energyProd_wh / esolar_sum_last);
            }
            if(esolar_sum_next!=0) {
              escale = esolar_sum_last / esolar_sum_next;
            }


            let consumption = payload.stats.last24h.consumption_wh * 10000000;
            if(typeof payload.stats.last7d !== 'undefined') {
              consumption = Math.round(( Math.round((payload.stats.last7d.consumption_wh * 10000000)/7) + (payload.stats.last24h.consumption_wh * 10000000))/2);
            }
            if(typeof payload.stats.last30d !== 'undefined') {
              consumption = Math.round((Math.round((payload.stats.last7d.consumption_wh * 10000000)/7) + Math.round((payload.stats.last30d.consumption_wh * 10000000)/30))/2);
            }
            if(typeof payload.stats.last365d !== 'undefined') {
              consumption = Math.round((Math.round((payload.stats.last7d.consumption_wh * 10000000)/7) + Math.round((payload.stats.last365d.consumption_wh * 10000000)/365))/2);
            }
            let energySelf = (payload.stats.last24h.energySelf_wh/payload.stats.last24h.energyProd_wh)*energyProd;
            let energyOut = energyProd - energySelf;
            let energy = consumption - energySelf;
            if(energyOut < 0) energyOut = 0;
            if(energy < 0) energy = 0;

            readings.push({
                time: new Date().getTime(),
                values: {
                  energy: 0,
                  energyOut: 0
                }
            });
            readings.push({
                time: new Date().getTime() + 86400000,
                values: {
                  energy: energy,
                  energyOut: energyOut
                }
            });
            let prodReadings = [];
            prodReadings.push({
                time: new Date().getTime(),
                values: {
                  energy: 0,
                  energyOut: 0
                }
            });
            prodReadings.push({
                time: new Date().getTime() + 86400000,
                values: {
                  energy: energyProd,
                  energyOut: energyProd
                }
            });
            from = new Date().getTime();
            to = from + 86400000;


            await retrieveAndSet('next24h',nodeconfig,config,meterinfo,'one_day',from,to,readings,prodReadings);
            payload.stats.next24h.escale = escale;
            payload.stats.next24h.efactor = efactor;
            payload.stats.next24h.esolar_wh = esolarwh;
            payload.stats.next24h.prodWh = [];

            for(let i=0;(i<payload.stats.gsi.periods.length);i++) {
              payload.stats.next24h.prodWh.push({
                time:payload.stats.gsi.periods[i].epochtime * 1000,
                energy:payload.stats.gsi.periods[i].esolar * esolarwh
              })
            }
          }
      }
    } catch(e) {
      if(typeof config._logger !== 'undefined') {
        config._logger.warn("Error retrieving Statistics from Underlaying API",e);
      } else {
        console.log(e);
      }
      throw Error(e);
    }
    return payload;
};
