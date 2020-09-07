const CasaCorrently = require("../app.js");
const fs = require("fs");
const axios = require("axios");
const assert = require('assert');

describe('Standalone test', function () {

    it('Should load with sample config', function (done) {
        const test = async function() {
          const config = JSON.parse(fs.readFileSync("./sample_config.json"));
          config.port = 55947;
          let main = await CasaCorrently();
          await main.server(config);
          setTimeout(function() {
            main.shutdown()
            done();
          },1000);
        }
        test();
    });
    it('Should listen on port and provide msg', function (done) {
        this.timeout(25000);
        const test = async function() {
          const config = JSON.parse(fs.readFileSync("./sample_config.json"));
          config.port = 55947;
          let main = await CasaCorrently();
          await main.server(config);
          setTimeout(async function() {
            let responds = await axios.get("http://localhost:55947/msg");
            if(typeof responds.data == 'undefined') throw Error('no Responds');
            if(typeof responds.data.meterinfo == 'undefined') throw Error('meterinfo not available');
            if(typeof responds.data.stats == 'undefined') throw Error('stats not available');
            main.shutdown();
            done();
          },1000);
        }
        test();
    });
});
