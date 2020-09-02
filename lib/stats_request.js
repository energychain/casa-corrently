module.exports = async function(nodeconfig,config,meterinfo,resolution,from,to) {
    const axios = require("axios");
    if(typeof config.source == 'undefined') {
        config.source = "./discovergy.js";
    }
    const source = require(config.source);

    let responds = {};
    let production = {};

    const getResponds = source.historicReading;
    responds = await getResponds(config.meterId,resolution,from,to,nodeconfig);
    if(responds.length < 1) {
      return {};
    }
    let stats = {
        energy: responds[responds.length -1].values.energy - responds[0].values.energy,
        energyOut: responds[responds.length -1].values.energyOut - responds[0].values.energyOut
    };
    stats.energy_wh = Math.round(stats.energy/10000000);
    stats.energyOut_wh = Math.round(stats.energyOut/10000000);

    if((typeof config.prodMeterId !== 'undefined')&&(config.prodMeterId.length > 10)) {
      let production = await getResponds(config.prodMeterId,resolution,from,to,nodeconfig);
      if(production.length > 0) {
        if(production[production.length -1].values.energy > production[production.length -1].values.energyOut) {
          stats.energyProd = production[production.length -1].values.energy - production[0].values.energy;
        } else {
          stats.energyProd = production[production.length -1].values.energyOut - production[0].values.energyOut;
        }
        stats.energyProd_wh = Math.round(stats.energyProd/10000000);
      }

      if(config.isProduction == false) {
        stats.energySelf_wh = stats.energyProd_wh - stats.energyOut_wh; }
      else {
        stats.energySelf_wh=0;
        stats.energyOut_wh = stats.energyProd_wh;
      }
      stats.energySavingsSelf = Math.round((meterinfo.energyPriceWh-(config.revenue/1000)) * stats.energySelf_wh *100)/100;
      stats.consumption_wh = stats.energySelf_wh +  stats.energy_wh;
    } else {
      stats.energySavingsSelf = 0;
      stats.consumption_wh = stats.energy_wh;
    }

    let deltayears = (to - from) / (365*86400000);
    stats.baseCosts =  Math.round(meterinfo.yearlyBasePrice * deltayears * 100)/100;
    stats.amortization =  Math.round(config.amortization * deltayears * 100)/100;
    stats.energyCost = Math.round(meterinfo.energyPriceWh * (stats.energy_wh)*100)/100;
    stats.correntlyIncome = Math.round((deltayears * meterinfo.correntlycnt * 1000 * meterinfo.energyPriceWh * 1000))/1000;
    stats.energyIncome = Math.round(config.revenue * (stats.energyOut_wh))/1000;
    stats.energyRevenue = (Math.round(config.revenue * (stats.energyOut_wh))/1000) + stats.energySavingsSelf + stats.correntlyIncome;
    stats.energySpendings =  (  stats.energyCost + stats.baseCosts + stats.amortization);
    stats.incomeSaldo = Math.round((stats.energyRevenue - (  stats.energyCost + stats.baseCosts + stats.amortization))*100)/100;
    stats.energyPrice_kwh = Math.round((stats.incomeSaldo / (stats.consumption_wh/1000))*10000)/-10000;
    stats.energySaldo_wh = (stats.energyOut_wh - stats.energy_wh);
    stats.yield = Math.round(((stats.energyRevenue / stats.energySpendings)-1)*100);
    let alternativecosts = (stats.consumption_wh * meterinfo.energyPriceWh) + stats.baseCosts;
    stats.savingsPercent = Math.round((1-(((-1)*stats.incomeSaldo)/alternativecosts))*(10000))/100;
    return stats;

};
