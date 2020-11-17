module.exports = async function(cfg) {
  let instance = {};
  instance.version = "1.0.38";
  instance.versions = {};

  instance.meterLib = require("./lib/meter.js");
  instance.listener = {};
  instance.runner = -1;
  instance.shutdown = function() {
    try {
      instance.listener.close();
      clearInterval(instance.runner);
    } catch(e) {
      console.log("Failed to shutdown runner",e);
    }
  }
  instance.server = async function(config,logger) {
    const meterLib = instance.meterLib;
    const fs = require("fs");
    const ncp = require('recursive-copy');
    const express = require('express');
    const bodyParser = require('body-parser');
    const axios = require('axios');
    const urlencodedParser = bodyParser.urlencoded({ extended: false });
    let port = 3000;
    const getVersions = async function() {
        const fileExists = async path => !!(await fs.promises.stat(path).catch(e => false));

        const checkVersionFS = async function(pname) {
              if(await fileExists(__dirname+'/'+pname)) {
                let pkgjson = JSON.parse(fs.readFileSync(__dirname+'/'+pname));
                instance.versions[pkgjson.name] = {
                  version:pkgjson.version,
                  path:pname
                }
              }
              if(await fileExists(__dirname+'/../'+pname)) {
                let pkgjson = JSON.parse(fs.readFileSync(__dirname+'/../'+pname));
                instance.versions[pkgjson.name] = {
                  version:pkgjson.version,
                  path:pname
                }
              }
        }
        checkVersionFS('./package.json');
        checkVersionFS('node_modules/casa-corrently/package.json');
        checkVersionFS('node_modules/casa-corrently-ipfs-bridge/package.json');
        checkVersionFS('node_modules/casa-corrently-ipfs-edge/package.json');
        checkVersionFS('node_modules/casa-corrently-openems/package.json');
        checkVersionFS('node_modules/casa-corrently-webinterface/package.json');
    }
    setTimeout(function() {
      getVersions();
    },1000);
    if(typeof logger !== 'undefined') {
      config._logger = logger;
    }

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
      let publisher = null;

      app.get('/msg', async function (req, res) {
          delete msg.payload.latest;
          const result = await meterLib(msg,config,storage);
          if(publisher !== null) {
            res.header("Access-Control-Allow-Origin", "*");
            let history = await publisher.publish(result,config.uuid);
            result.localHistory = history;
            res.send(result);
          } else {
            res.send(result);
          }
      });
      app.get('/history', async function (req, res) {
          delete msg.payload.latest;
          let result = {};
          if(publisher !== null) {
            res.header("Access-Control-Allow-Origin", "*");
            let history = await publisher.history();
            result = history;
            res.send(result);
          } else {
            res.send(result);
          }
      });
      app.get('/ipfs', async function (req, res) {
          delete msg.payload.latest;
          let result = {};
          if(publisher !== null) {
            res.header("Access-Control-Allow-Origin", "*");
            const result = await axios.get('https://gateway.ipfs.io/ipfs/'+req.query.cid);
            res.send(result.data);
          } else {
            res.send([]);
          }
      });

      app.get('/config', async function (req, res) {
          // caution circular structure with logger attached!
          delete config._logger;
          res.send(config);
      });
      app.get('/versions', async function (req, res) {
          // caution circular structure with logger attached!
          res.send(instance.versions);
      });

      if(typeof config.staticFiles == 'undefined') {
        config.staticFiles = '/./public';
      }

      // Create a "temporary" static www directory to be patched by publisher later
      try
      {
          await ncp(__dirname+config.staticFiles,__dirname+'/www/',{
            dot:false,
            junk:false,
            overwrite:true,
          });
          app.use(express.static(__dirname+"/www/", {}));
      } catch(e) {
        console.log(e);
        if(typeof logger !== 'undefined') logger.info('Using Default static files');
        app.use(express.static(config.staticFiles, {}));
      }

      if(typeof config.publisher !== 'undefined') {
        const PublisherLib = require(config.publisher);
        publisher = PublisherLib(config);
        await publisher.statics();
        const result = await meterLib(msg,config,storage);
        publisher.publish(result);
        app.get('/p2p', async function (req, res) {
            // caution circular structure with logger attached!
              let p2pcontent = await publisher.info(req.query);
              // CORS make no sense for P2P!
              res.header("Access-Control-Allow-Origin", "*");
              res.send(p2pcontent);
        });
        app.get('/history', async function (req, res) {
            // caution circular structure with logger attached!
              let history = await publisher.history();
              // CORS make no sense for P2P!
              res.header("Access-Control-Allow-Origin", "*");
              res.send(history);
        });
      } else {
        app.get('/p2p', async function (req, res) {
              let p2pcontent = axios.get("https://casa-corrently.de/p2p");
              // CORS make no sense for P2P!
              res.header("Access-Control-Allow-Origin", "*");
              res.send(p2pcontent.data);
        });
      }
      instance.runner = setInterval(async function() {
        msg = {
          payload: {},
          topic: 'statistics'
        };
        const result = await meterLib(msg,config,storage);
        if(publisher !== null) publisher.publish(result,config.uuid);
        if(typeof logger !== 'undefined') logger.debug("Auto updated statistics");
      },900000);
      if(typeof logger !== 'undefined') logger.info("Serving Casa-Corrently on http://localhost:"+port +"/ ");
      instance.listener = app.listen(port);
    };

    if(typeof process.env.PORT !== 'undefined') {
      port = process.env.PORT;
    }

    if(typeof config.port !== 'undefined') {
      // TODO: add unit test if port is taken from config nor from environment
      port = config.port;
    }
    main(config);
  };

  return instance;
};
