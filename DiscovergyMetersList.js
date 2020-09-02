module.exports = function(RED) {
  const axios = require("axios");

  function metersNode(config) {
      RED.nodes.createNode(this,config);
      var node = this;

      node.on('input', async function(msg) {

        if((typeof node.context().global.get("discovergy_username") !== 'undefined')&&( node.context().global.get("discovergy_username") !== null)) {
            config.username = node.context().global.get("discovergy_username");
            config.password =  node.context().global.get("discovergy_password");
        }
        if(typeof msg.payload.username !== 'undefined') {
          config.username = msg.payload.username;
          config.password = msg.payload.password;
        }

        let meters = await axios.get("https://api.discovergy.com/public/v1/meters",{
                       auth: {
                         username: config.username,
                         password: config.password
                     }});
        meters = meters.data;
        let options = [];

        for(let i=0;i<meters.length;i++) {
            let option = {};
            option[""+meters[i].fullSerialNumber] = meters[i].meterId;
            options.push(option);
        }
        msg.options = options;
        msg.payload = options;
        node.send(msg);

      });

    }
  RED.nodes.registerType("Available Meters",metersNode);
};
