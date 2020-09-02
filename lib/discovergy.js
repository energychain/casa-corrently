const axios = require("axios");

module.exports = {
  last_reading: async function(meterId,node) {
        let responds = {};
        try {
          responds = await axios.get("https://api.discovergy.com/public/v1/last_reading?meterId="+meterId,{
                       auth: {
                         username: node.config.credentials.username,
                         password: node.config.credentials.password
                     }});
        } catch(e) {
          console.warn("API Request failed:last_reading","https://api.discovergy.com/public/v1/last_reading?meterId="+meterId);
          throw Error(e);
        }
        if(typeof responds.data !== 'undefined') {
          return responds.data;
        } else {
          throw Error('Invalid Consensus with backend API');
        }
  },
  historicReading: async function(meterId,resolution,from,to,node) {
    let responds = await axios.get("https://api.discovergy.com/public/v1/readings?meterId="+meterId+"&resolution="+resolution+"&from="+from+"&to="+to,{
               auth: {
                 username: node.credentials.username,
                 password: node.credentials.password
    }});
    return responds.data;
  },
  meters: async function(node) {
    let meters = await axios.get("https://api.discovergy.com/public/v1/meters",{
                   auth: {
                     username: node.config.credentials.username,
                     password: node.config.credentials.password
    }});
    return meters.data;
  }
};
