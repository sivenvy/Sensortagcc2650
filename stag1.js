	$ npm install sensortag node-dweetio async

var util = require('util');
var async = require('async');
var SensorTag = require('sensortag');
var dweetClient = require("node-dweetio");
var dweetio = new dweetClient();
SensorTag.discover(function discovered(sensorTag) {
  console.log('discovered: ' + sensorTag);
  sensorTag.on('disconnect', function() {
    console.log('disconnected!');
    process.exit(0);
  });
  var thing = sensorTag.type + '-' + sensorTag.uuid;
  console.log("http://dweet.io/follow/" + thing);
  var content = {};
  async.series([
      function(callback) {
        console.log('connectAndSetUp');
        sensorTag.connectAndSetUp(callback);
      },
      function(callback) {
        console.log('enableHumidity');
        sensorTag.enableHumidity(callback);
      },
      function(callback) {
        setTimeout(callback, 2000);
      },
      function(callback) {
        sensorTag.on('humidityChange', function(temperature, humidity) {
          console.log('\ttemperature = %d °C', temperature.toFixed(1));
          console.log('\thumidity = %d %', humidity.toFixed(1));
          content.temperature = Number(temperature.toFixed(1));
          content.humidity = Number(humidity.toFixed(1));
        });
        console.log('setHumidityPeriod');
        sensorTag.setHumidityPeriod(1000, function(error) {
          console.log('notifyHumidity');
          sensorTag.notifyHumidity(function(error) {
            callback();
          });
        });
      }
    ]
  );
  setInterval(function () {
    if ( content.humidity ) {
      dweetio.dweet_for(thing, content, function(err, dweet){
        console.log(dweet.thing); // "my-thing"
        console.log(dweet.content); // The content of the dweet
        console.log(dweet.created); // The create date of the dweet
      });
    }
  }, 5000);    // 5s
});
