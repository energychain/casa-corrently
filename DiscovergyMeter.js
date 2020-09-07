module.exports = function(RED) {
  const axios = require("axios");
  const discovergyLib = require("./lib/meter.js");

  function discovergyNode(config) {
      RED.nodes.createNode(this,config);
      var node = this;

      node.on('input', async function(msg) {
        // hack for global configuration options
        if((typeof node.context().global.get("discovergy_username") !== 'undefined')&&( node.context().global.get("discovergy_username") !== null)) {
            config.username = node.context().global.get("discovergy_username");
            config.password =  node.context().global.get("discovergy_password");
            config.revenue = node.context().global.get("discovergy_revenue") * 1;
            config.meterId = node.context().global.get("discovergy_meterId");
            if(config.meterId == '781ffa307e434529be9f747eece1b8dc') {
              config.amortization = 1700;
              config.firstReadingDate = "2017-01-01";
              config.firstReading = 4614000;
              config.firstReadingOut = 3915000;
              config.firstReadingProd = 21260000;
              config.prodMeterId = '303fbb8ca6404ebba48c196b4dbbc176';
            }
        }
        if(typeof config.uuid == 'undefined') {
          config.uuid = config.meterId;
        }
        msg.payload = await discovergyLib(msg,config,node.context(),RED);
        node.send(msg);
      });

    }
  RED.nodes.registerType("Discovergy Meter",discovergyNode);

    function DiscovergyConfigNode(n) {
      RED.nodes.createNode(this, n);
      var node = this;

      node.config = {
        username: node.credentials.username,
        password: node.credentials.password
      };
    }

    RED.nodes.registerType("discovergy-config", DiscovergyConfigNode, {
        credentials: {
          username: {type: "text"},
          password: {type: "password"}
        }
      });

    RED.httpAdmin.get('/discovergy/meters', async (req, res) => {
          let config = RED.nodes.getNode(req.query.account);
          if(config == null) {
            console.log("*** You need to deploy your login credentials before you could retrieve available meters");
            res.end(JSON.stringify([]));
          } else {
           try {
               let meters = await axios.get("https://api.discovergy.com/public/v1/meters",{
                              auth: {
                                username: config.credentials.username,
                                password: config.credentials.password
                            }});
               res.end(JSON.stringify(meters.data));

           } catch (error) {
             console.log(error);
             res.sendStatus(500).send(error.message);
           }
          }
    });
};
