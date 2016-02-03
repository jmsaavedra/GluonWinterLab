var BROADCAST_IP = "192.168.0.255"
var MULTICAST_IP = "230.185.192.108"
//var TRIGGER_IP = "192.168.0.43"//CHRIS' IP
var TRIGGER_IP = "192.168.0.3" //TRUE IP
var BROWSER_IP = "192.168.0.4"

var PORT = 41234

/* NODE JS INCLUDES */
var Gpio = require('onoff').Gpio;
var http = require('http')
var fs = require('fs')
var exec = require('child_process').exec
var dgram = require("dgram")

var serialNumber;
//[SHUTTER, AF, RED, GRN, BLUE, 3MM, LASER]
var PIN = [4, 17, 24, 27, 25, 22];
var picCt =0; //picture count

//*** SETUP PINS
var PIN_SHUTTER   = new Gpio(PIN[0], 'out');
var PIN_AF        = new Gpio(PIN[1], 'out');
var PIN_LED_RED   = new Gpio(PIN[2], 'out');
var PIN_LED_GRN   = new Gpio(PIN[3], 'out');
var PIN_LED_BLUE  = new Gpio(PIN[4], 'out');
var PIN_LED_3MM   = new Gpio(PIN[5], 'out');


/* UDP CLIENT/SERVER CONNECTION*/
var client = dgram.createSocket("udp4")

var message = new Buffer("hello world")

client.on("message", function (msg, rinfo) {
  console.log("server got: " + msg + " from " +rinfo.address + ":" + rinfo.port);
  var data = msg.toString()
  if(data=='go'){
    hitShutter(); //*** TAKE PICTURE !!

    console.log("trigger shutter, count "+ (picCt++));
  }

});

client.on("listening", function () {
  client.setBroadcast(true)
  client.setMulticastTTL(128);
  client.addMembership('230.185.192.108');
  var address = client.address();
  console.log("client listening " +address.address + ":" + address.port);
  // getSerialNumber(function(obj){
  //   var message = new Buffer(obj)
  //   client.send(message,0,message.length,PORT,TRIGGER_IP,function(err,bytes){
  //     console.log('Sent Message')
  //   })
  //
  // })
});

client.bind(41234)

//must send message after client is bound

/* SEND HELLO WORLD MESSAGE TO SERVER */

// getSerialNumber(function(obj){
//   var message = new Buffer(obj)
//   client.send(message,0,message.length,PORT,TRIGGER_IP,function(err,bytes){
//     console.log('Sent Message')
//   })
//
// })


//**** TAKE A PICTURE !! ****
function hitShutter(){
  digitalWrite(PIN_SHUTTER, 1);
  digitalWrite(PIN_LED_GRN, 1);
  setTimeout(function(){
     digitalWrite(PIN_SHUTTER, 0);
     digitalWrite(PIN_LED_GRN, 0);
   },300); //button press duration
}

//**** half-press for Auto-Focus
function hitAutoFocus(){
  digitalWrite(PIN_AF, 1);
  setTimeout(function(){
     digitalWrite(PIN_AF, 0);
  },300); //button press duration
}

//** digitalWrite function
function digitalWrite(pin, state){
  pin.write(state, function(err) { // Asynchronous write.
    //pin.write(value === 0 ? 1 : 0, function(err) {
      if (err) throw err;
  });
}


function newCameraPost(objstring){
  var options = {
    host:BROWSER_IP,
    port:3000,
    path:'/camera',
    method:'GET',
    headers:{
    'Content-Type': 'application/json',
    'Content-Length': objstring.length
    }
  }
  // also send to browser computer
  var req = http.get(options,function(res){})
  req.write(objstring)
  req.end()
}


function getSerialNumber(cb){

  var _this = this
  console.log('Serial Attempt')
  console.log('Getting Serial Number')
  http.get("http://localhost:8080/get?eosserialnumber", function(res) {
    res.on('data', function (chunk) {
      serialnumber = JSON.parse(chunk.toString())['eosserialnumber']
      console.log('Camera Serial: '+serialnumber)
      //console.log('BODY: ' + chunk);
      var obj = {'serial':serialnumber}
      //console.log(obj)
      var objstring = JSON.stringify(obj)
      newCameraPost(objstring)
      cb(objstring)
    })
  }).on('error', function(e) {
    console.log("Got error: " + e.message);
    //getSerialNumber(cb)
    //might need to be this
    //_this(ipAddress,cb)
  });
}

process.on('message',function(msg){

  console.log('Process Received Message')
  console.log(msg)
  if(msg == 'shutdown'){

    client.close()
    console.log('shutting down')

  }
})

process.on('SIGHUP', function() {
  console.log(' Got SIGHUP closing gpio')
  console.log(' Goodbye ')
  client.close()
  process.exit(0)
})

process.on('SIGTERM', function() {
  console.log(' Got SIGTERM closing gpio')
  console.log(' Goodbye ')
  client.close()
  process.exit(0)
})

process.on('SIGINT', function() {
  console.log(' Got SIGINT closing gpio')
  console.log(' Goodbye ')
  client.close()
  process.exit(0)
})
