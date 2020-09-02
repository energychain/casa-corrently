module.exports = async function(payload,config,nodeconfig,meterinfo,storage) {
  function Sleep(milliseconds) {
   return new Promise(resolve => setTimeout(resolve, milliseconds));
 }

  const fetchTimeFrame = require("./stats_request.js");
  const community = require("./community.js");

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
            payload.stats[statname].updated = new Date().getTime();
            storage.set(statname,payload.stats[statname]);
            await Sleep(200); // Delay to get DGY Api settled
            return;
          };
          let to = payload.time;
          let from = payload.time - (24* 3600000);
          payload.stats.last24h = await fetchTimeFrame(nodeconfig,config,meterinfo,'three_minutes',from,to);
          await Sleep(200); // Delay to get DGY Api settled
          to = payload.time;
          from =  new Date(payload.time).setHours(0,0,0,0);
          payload.stats.today = await fetchTimeFrame(nodeconfig,config,meterinfo,'three_minutes',from,to);
          await Sleep(200); // Delay to get DGY Api settled
      payload.stats.yesterday = storage.get("yesterday");
      if((typeof payload.stats.yesterday == "undefined")||(payload.stats.yesterday.updated==null)||(payload.stats.yesterday.updated < new Date().getTime() - (3600000*1))) {
          to = new Date(payload.time).setHours(0,0,0,0);
          from =  to - 86400000;
          await retrieveAndSet('yesterday',nodeconfig,config,meterinfo,'three_minutes',from,to);
      }
      payload.stats.last7d = storage.get("last7d");
      if((typeof payload.stats.last7d == "undefined")||(payload.stats.last7d.updated==null)||(payload.stats.last7d.updated < new Date().getTime() - (900000*1))) {
          to = payload.time;
          from =  to - (7*86400000);
          await retrieveAndSet('last7d',nodeconfig,config,meterinfo,'fifteen_minutes',from,to);
      }
      payload.stats.monthToDay = storage.get("monthToDay");
      if((typeof payload.stats.monthToDay == "undefined")||(payload.stats.monthToDay.updated==null)||(payload.stats.monthToDay.updated < new Date().getTime() - (900000*1))) {
          to = payload.time;
          let d = new Date(new Date(to).setHours(0,0,0,0));
          from =  new Date((d.getYear()+1900) + "-" + (d.getMonth()+1) + "-1").setHours(0,0,0,0);
          await retrieveAndSet('monthToDay',nodeconfig,config,meterinfo,'fifteen_minutes',from,to);
      }
      payload.stats.last30d = storage.get("last30d");
      if((typeof payload.stats.last30d == "undefined")||(payload.stats.last30d.updated==null)||(payload.stats.last30d.updated < new Date().getTime() - (900000*1))) {
          to = payload.time;
          from =  to - (30*86400000);
          await retrieveAndSet('last30d',nodeconfig,config,meterinfo,'fifteen_minutes',from,to);
      }
        payload.stats.lastMonth = storage.get("lastMonth");
        if((typeof payload.stats.lastMonth == "undefined")||(payload.stats.lastMonth.updated==null)||(payload.stats.lastMonth.updated < new Date().getTime() - (3600000*24))) {
          d = new Date(new Date(payload.time).setHours(0,0,0,0));
          to =  new Date((d.getYear()+1900) + "-" + (d.getMonth()+1) + "-1").setHours(0,0,0,0);
          d =   new Date(new Date(to).getTime() - (2*86400000));
          from =  new Date((d.getYear()+1900) + "-" + (d.getMonth()+1) + "-1").setHours(0,0,0,0);
          await retrieveAndSet('lastMonth',nodeconfig,config,meterinfo,'fifteen_minutes',from,to);
        }
          payload.stats.yearToDay = storage.get("yearToDay");
          if((typeof payload.stats.yearToDay == "undefined")||(payload.stats.yearToDay.updated==null)||(payload.stats.yearToDay.updated < new Date().getTime() - (3600000*2))) {
              to = payload.time;
              d = new Date(new Date(to).setHours(0,0,0,0));
              from =  new Date((d.getYear()+1900) + "-1-1").setHours(0,0,0,0);
              await retrieveAndSet('yearToDay',nodeconfig,config,meterinfo,'one_day',from,to);
          }
          payload.stats.last365d = storage.get("last365d");
          if((typeof payload.stats.last365d == "undefined")||(payload.stats.last365d.updated==null)||(payload.stats.last365d.updated < new Date().getTime() - (3600000*2))) {
                to = payload.time;
                d = new Date(new Date(to).setHours(0,0,0,0));
                from =   payload.time - (365*86400000);
                await retrieveAndSet('last365d',nodeconfig,config,meterinfo,'one_day',from,to);
          }
          payload.stats.lastYear = storage.get("lastYear");
          if((typeof payload.stats.lastYear == "undefined")||(payload.stats.lastYear.updated==null)||(payload.stats.lastYear.updated < new Date().getTime() - (86400000*14))) {
            d = new Date(new Date(to).setHours(0,0,0,0));
            from =  new Date((d.getYear()+1900) + "-1-1").setHours(0,0,0,0);
            to = from;
            from -= (365*86400000);
            await retrieveAndSet('lastYear',nodeconfig,config,meterinfo,'one_day',from,to);
          }
          if((typeof config.uuid !== 'undefined') && (typeof config.community !== 'undefined')) {
            await community(payload,storage,config);
          }
    } catch(e) {
      console.warn("Error retrieving Statistics from Underlaying API",e);
      throw Error(e);
    }
    return payload;
};
