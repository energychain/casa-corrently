module.exports = async function(payload,storage,config) {
  const axios = require("axios");
  const selectors = ['last24h','last7d','last30d','last365d'];

  let community_stats = storage.get("community");
  if((typeof community_stats == 'undefined') || (community_stats == null) || ( typeof community_stats.updated == 'undefined') || ( community_stats.updated < new Date().getTime()-3600000)) {
    let community_input = {
      uuid: config.uuid,
      community: config.community
    };
    for(let i=0;i<selectors.length;i++) {
      if(typeof payload.stats[selectors[i]] !== 'undefined') {
        community_input[selectors[i]] =  {
                  energyPrice_kwh: payload.stats[selectors[i]].energyPrice_kwh,
                  incomeSaldo: payload.stats[selectors[i]].incomeSaldo
                };
        }
    }
    try {
      community_input = await axios.post('http://lb5.stromdao.de:9988/casa',community_input);
      community_input = community_input.data;
    } catch(e) {

    }
    payload.community = community_input;
  } else {
    payload.community = community_stats;
  }
  return;
};
