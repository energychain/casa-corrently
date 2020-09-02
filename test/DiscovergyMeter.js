const helper = require("node-red-node-test-helper");
const dgyMeterNode = require("../DiscovergyMeter.js");

describe('DiscovergyMeter Node', function () {
    afterEach(function () {
      helper.unload();
    });
    let n1 = {
      id: "n1",
      type: "Discovergy Meter",
      name: "test name",
      username: "demo@corrently.de",
      password: "aNPR66nGXQhZ",
      meterId: '781ffa307e434529be9f747eece1b8dc'
    };

    const testBasicPropertiesOfMsg = function(msg) {
      msg.should.have.property('payload');
      msg.payload.should.have.property('time');
      msg.payload.should.have.property('latest');
      msg.payload.latest.should.have.property('power');
      msg.payload.latest.should.have.property('energy_wh');
      msg.payload.latest.should.have.property('energyOut_wh');
      msg.payload.latest.should.have.property('baseCosts');
      msg.payload.latest.should.have.property('energyCost');
    };

    it('should be loaded', function (done) {
        var flow = [n1];
        helper.load(dgyMeterNode, flow, function () {
          var n1 = helper.getNode("n1");
          n1.should.have.property('name', 'test name');
          done();
        });
    });

    it('should retrieve single meter measurements', function (done) {
      this.timeout(19000);
      n1.wires=[["n2"]];
      var flow = [
      n1,
        { id: "n2", type: "helper" }
      ];
      helper.load(dgyMeterNode, flow, function () {
        var n2 = helper.getNode("n2");
        var n1 = helper.getNode("n1");
        n2.on("input", function (msg) {
          testBasicPropertiesOfMsg(msg);
          done();
        });
        n1.receive({ payload: 'Wir lieben Corrently Ökostrom' });
      });
  });
  it('should retrieve two meter measurements (aggregation)', function (done) {
    this.timeout(19000);
    n1.wires=[["n3"]];
    var flow = [
      n1,
      {
          id: "n3",
          type: "Discovergy Meter",
          name: "test name",
          username: "demo@corrently.de",
          password: "aNPR66nGXQhZ",
          meterId: '781ffa307e434529be9f747eece1b8dc',
          wires:[["n2"]]
      },
      { id: "n2", type: "helper" }
    ];
    helper.load(dgyMeterNode, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      n2.on("input", function (msg) {
        testBasicPropertiesOfMsg(msg);
        msg.payload.should.have.property('aggregation');
        done();
      });
      n1.receive({ payload: 'Wir unterstützen die Corrently Idee' });
    });
});
});
