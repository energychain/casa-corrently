module.exports = async function(payload,aggregation) {

          payload.aggregation = {};
          if((typeof aggregation !== 'undefined') && (typeof aggregation.aggregation !== 'undefined')) {
            payload.aggregation = aggregation.aggregation;
          } else {
            if((typeof aggregation !== 'undefined')&&(typeof aggregation.latest !== 'undefined')) {
              payload.aggregation = { latest: aggregation.latest };
            } else {
              payload.aggregation = { latest: {} };
            }
          }

          if(payload.time < payload.aggregation.time ) {
            payload.aggregation.time = payload.time;
          }

          payload.aggregation.latest.power_w += payload.latest.power_w;
          payload.aggregation.latest.power += payload.latest.power;
          payload.aggregation.latest.power1 += payload.latest.power1;
          payload.aggregation.latest.power2 += payload.latest.power2;
          payload.aggregation.latest.power3 += payload.latest.power3;
          payload.aggregation.latest.energy += payload.latest.energy;
          payload.aggregation.latest.energyOut += payload.latest.energyOut;
          payload.aggregation.latest.energy_wh += payload.latest.energy_wh;
          payload.aggregation.latest.energyOut_wh += payload.latest.energyOut_wh;
          payload.aggregation.latest.baseCosts += payload.latest.baseCosts;
          payload.aggregation.latest.energyCost += payload.latest.energyCost;
          payload.aggregation.latest.energyRevenue += payload.latest.energyRevenue;
          payload.aggregation.latest.incomeSaldo += payload.latest.incomeSaldo;
          payload.aggregation.latest.energySaldo_wh += payload.latest.energySaldo_wh;
          payload.aggregation.latest.amortization += payload.latest.amortization;

          if((typeof payload.aggregation.stats !== 'undefined') && (typeof payload.stats !== 'undefined')) {
            const aggregateStats = function(aggregation,addition) {
              aggregation.energy += addition.energy;
              aggregation.energyOut += addition.energyOut;
              aggregation.energy_wh += addition.energy_wh;
              aggregation.energyOut_wh += addition.energyOut_wh;
              aggregation.baseCosts += addition.baseCosts;
              aggregation.energyCost += addition.energyCost;
              aggregation.energyRevenue += addition.energyRevenue;
              aggregation.amortization += addition.amortization;
              return aggregation;
            };

            payload.aggregation.stats.last24h = aggregateStats(payload.aggregation.stats.last24h, payload.stats.last24h);
            payload.aggregation.stats.today = aggregateStats(payload.aggregation.stats.today, payload.stats.today);
            payload.aggregation.stats.yesterday = aggregateStats(payload.aggregation.stats.yesterday, payload.stats.yesterday);
            payload.aggregation.stats.monthToDay = aggregateStats(payload.aggregation.stats.monthToDay, payload.stats.monthToDay);
            payload.aggregation.stats.lastMonth = aggregateStats(payload.aggregation.stats.lastMonth, payload.stats.lastMonth);
            payload.aggregation.stats.yearToDay = aggregateStats(payload.aggregation.stats.yearToDay, payload.stats.yearToDay);
            payload.aggregation.stats.last365d = aggregateStats(payload.aggregation.stats.last365d, payload.stats.last365d);
          }

          return payload;
};
