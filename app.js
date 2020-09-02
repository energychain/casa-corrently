module.exports = async function() {
  let instance = {};
  instance.server = async function(config) {
    const meterLib = require("./lib/meter.js");
    const fs = require("fs");
    const express = require('express');
    const bodyParser = require('body-parser');
    const urlencodedParser = bodyParser.urlencoded({ extended: false });
    let port = 3000;

    const storage = {
      memstorage:{},
      get:function(key) {
        return this.memstorage[key];
      },
      set:function(key,value) {
        this.memstorage[key] = value;
      }
    };

    const main = async function(config) {
      let app = express();

      let msg = {
        payload: {},
        topic: 'statistics'
      };

      app.get('/msg', async function (req, res) {
          delete msg.payload.latest;
          const result = await meterLib(msg,config,storage);
          res.send(result);
      });

      app.get('/config', async function (req, res) {
          res.send(config);
      });

      app.post('/config',urlencodedParser,async function(req,res) {
          config = req.body;
          res.send();
      });
      if(typeof config.staticFiles == 'undefined') {
        config.staticFiles = './public';
      }
      app.use(express.static(config.staticFiles, {}));

      setInterval(function() {
        delete msg.payload.latest;
        meterLib(msg,config,storage);
      },900000);
      console.log("Serving http://localhost:"+port +"/");
      app.listen(port);
    };

    if(typeof process.env.PORT !== 'undefined') {
      port = process.env.PORT;
    }

    if(typeof config.port !== 'undefined') {
      post = config.port;
    }
    main(config);
  };
  return instance;
};
