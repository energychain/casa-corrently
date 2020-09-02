module.exports = async function(payload,meterinfo,config,productionData) {
  if(typeof payload.values.energy !== "undefined") {
    payload.values.energy_wh = Math.round(payload.values.energy/10000000);
  }
  if(typeof payload.values.energyOut !== "undefined") {
    payload.values.energyOut_wh = Math.round(payload.values.energyOut/10000000) - config.firstReadingOut;
  }
  if(typeof productionData.values !== "undefined") {
      if(productionData.values.energy < productionData.values.energyOut) {
        productionData.values.energy =  productionData.values.energyOut;
      }
      payload.values.energyProd = productionData.values.energy;
      payload.values.energyProd_wh = Math.round(payload.values.energyProd/10000000) - config.firstReadingProd;
      if(config.isProduction == false) {
        meterinfo.messkonzept = "Messkonzept 4";
        payload.values.energySelf_wh = (payload.values.energyProd_wh - config.firstReadingProd) - (payload.values.energyOut_wh - config.firstReadingOut);
      } else {
        meterinfo.messkonzept = "Messkonzept 3";
        payload.values.energySelf_wh=0;
        payload.values.energyOut_wh = payload.values.energyProd_wh;
      }
      payload.values.consumption_wh = payload.values.energySelf_wh + payload.values.energy_wh;

  } else { payload.values.energySelf_wh = 0; payload.values.consumption_wh = payload.values.energy_wh;}
  if(typeof payload.values.power1 !== "undefined") {
    payload.values.power1_w = Math.round(payload.values.power1/1000);
    payload.values.power2_w = Math.round(payload.values.power2/1000);
    payload.values.power3_w = Math.round(payload.values.power3/1000);
  }

  if(typeof payload.values.power !== "undefined") {
    payload.values.power_w = Math.round(payload.values.power/1000);
  }
  if((typeof meterinfo !== "undefined") && (meterinfo !== null) && (typeof meterinfo.yearlyBasePrice !== 'undefined')) {
      let deltayears = (meterinfo.lastMeasurementTime - meterinfo.firstMeasurementTime) / (365*86400000);
      payload.values.baseCosts = Math.round(meterinfo.yearlyBasePrice * deltayears * 100)/100;
      payload.values.amortization = Math.round(config.amortization * deltayears * 100)/100;
      payload.values.energyCost =  Math.round(meterinfo.energyPriceWh * (payload.values.energy_wh-config.firstReading)*100)/100;
      payload.values.energyRevenue = (Math.round(config.revenue * payload.values.energyOut_wh)/1000);
      payload.values.energyIncome = payload.values.energyRevenue;
      payload.values.energySavingsSelf = Math.round((meterinfo.energyPriceWh-(config.revenue/1000)) * payload.values.energySelf_wh *100)/100;
      payload.values.energyRevenue += payload.values.energySavingsSelf;
      payload.values.energySpendings = payload.values.energyCost + payload.values.baseCosts + payload.values.amortization;
      payload.values.incomeSaldo = Math.round((payload.values.energyRevenue - (  payload.values.energyCost + payload.values.baseCosts + payload.values.amortization ))*100)/100;
      payload.values.energySaldo_wh = (payload.values.energyOut_wh - payload.values.energy_wh);
      payload.values.yield = Math.round(((payload.values.energyRevenue / payload.values.energySpendings)-1)*100);
      payload.values.energyPrice_kwh = Math.round((payload.values.incomeSaldo / (payload.values.consumption_wh/1000))*10000)/-10000;
      payload.meterinfo = meterinfo;
  }
  // map .values to .latest
  payload.latest = payload.values;
  delete payload.values;

  return payload;
};
