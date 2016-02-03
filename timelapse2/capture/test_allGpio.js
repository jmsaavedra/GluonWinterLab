


/* CAPTURE.JS

  - receives 'go' from trigger server
  - toggles SHUTTER and AF gpio pins
  - sends cameraPost to server after photo is taken
*/

//**********************************//

var BROWSER_IP = "192.168.0.4" //TRUE
var TRIGGER_IP = "192.168.0.3" //TRUE
// var BROWSER_IP = "192.168.0.42"
// var TRIGGER_IP = "192.168.0.42"
var TRIGGER_PORT    = "1234"

//**********************************//

var Gpio = require('onoff').Gpio;
var WebSocket = require('ws')
var os = require('os')
var http = require('http')
var fs = require('fs')
var exec = require('child_process').exec
var ws;


//** VAR DECLARATIONS
var serialNumber = ''
var ipAddress = '';
var websocket =''
var browserapp = ''

//*** VARS
var groupLeader = true;
var triggerState = 0; //prevent false triggers
var triggerBufferTime = 1500; //how long to wait before next trigger
var picCt = 0;

var hasIPAddress = false;
var socketCounter = 0;

//all should be configured to OUT except for pin 23.
var PIN = [23, 4, 17, 24, 27, 25];

for(var i=0; i<PIN.length; i++){
  var strExec; //string to execute
  if(i<1) strExec = 'gpio export '+PIN[i]+ ' in';
  else strExec = 'gpio export '+PIN[i]+ ' out';

  var child = exec(strExec,function(error,stdout,stderr){
    if(error) console.log("GPIO ERROR: "+error);
  })
}

//*** SETUP PINS
var PIN_LASER     = new Gpio(PIN[0], 'in', 'rising');//'both');
var PIN_SHUTTER   = new Gpio(PIN[1], 'out');
var PIN_AF        = new Gpio(PIN[2], 'out');
var PIN_LED_RED   = new Gpio(PIN[3], 'out');
var PIN_LED_GRN   = new Gpio(PIN[4], 'out');
var PIN_LED_BLUE  = new Gpio(PIN[5], 'out');

var standbyLed    = PIN_LED_BLUE;
setTimeout(function(){
   configLaser(groupLeader); //config as default
 },1000); //wait a second for Gpio(pin) to config first


getIPAddress(function(_ipAddress){
  console.log('IP ADDRESS: '+_ipAddress)
  if(!_ipAddress){ getIPAddress(arguments.callee)
  }else if(_ipAddress.toString().indexOf('192.168.0')===-1){
      getIPAddress(arguments.callee())
  }else{
    ipAddress = _ipAddress
    getSerialNumber(ipAddress,function(objectstring){
      connectSocket(objectstring)
    })
  }
})


//*** SETUP NETWORK CONNECTION
function getIPAddress(cb){
  //console.log('getIP')
  var networkInterfaces = os.networkInterfaces();
  console.log(networkInterfaces)
  if(networkInterfaces.hasOwnProperty('eth0')){
    if(networkInterfaces.eth0[0].hasOwnProperty('address')){
      cb(networkInterfaces.eth0[0].address)
    }else cb(null)
  }else cb(null)
  //ipAddress = networkInterfaces.eth0[0].address;
}

function getSerialNumber(ipAddress,cb){
  var _this = this
  console.log('Getting Serial Number')
  http.get("http://localhost:8080/get?eosserialnumber", function(res) {
    res.on('data', function (chunk) {
      serialnumber = JSON.parse(chunk.toString())['eosserialnumber']
      console.log('Camera Serial: '+serialnumber)
      //console.log('BODY: ' + chunk);
      var obj = {'address':ipAddress, 'serial':serialnumber}
      console.log(obj)
      var objstring = JSON.stringify(obj)
      newCameraPost(objstring)
      cb(objstring)
    })
  }).on('error', function(e) {
    console.log("Got error: " + e.message);
    getSerialNumber(ipAddress,cb)
    //might need to be this
    //_this(ipAddress,cb)
  });
}



//*** OPEN WEBSOCKET
function connectSocket(objectstring){
  console.log('connecting sockets')
  console.log(objectstring)
  console.log('socketCounter '+socketCounter)
  if(socketCounter < 1){
    socketCounter++
    ws = new WebSocket('ws://'+TRIGGER_IP+':'+TRIGGER_PORT);
    ws.on('open', function() {
      console.log("socket open")
      ws.send(objectstring)
    })


    ws.on('close',function(){
      /** TO DO **/
      //handle disconnect/attempt reconnect
      socketCounter--
      console.log('disconnected')
    })


    //*** HANDLE WEBSOCKET MESSAGES
    ws.on('message', function(data, flags) {
      if(data == 'go'){
        // flags.binary will be set if a binary data is received
        // flags.masked will be set if the data was masked
        hitShutter(); //*** TAKE PICTURE !!
        console.log("trigger shutter, count "+ (picCt++));
      }
      else if(data == 'close'){
        var child = exec('echo raspberry | sudo shutdown -h now',function(error,stdout,stderr){
          console.log('stdout: '+stdout)
          console.log('stderr: '+stderr)
        })
      }

      else if(data == 'toggleleader'){
        configLaser(!groupLeader);
      }

    })
  }
}

//** CONFIGURE LASER **
//can be set through /toggleleader route currently
function configLaser(job){
  groupLeader = job;
  digitalWrite(standbyLed, 0);

  if(groupLeader){ //watch sensor!

    var strExec = 'gpio export '+PIN_LASER+ ' out';
    var child = exec(strExec,function(error,stdout,stderr){
      if(error) console.log("GPIO ERROR: "+error);
      else {
        //** set watch with callback on laserpin RISING
        PIN_LASER.watch(function(err, value) {
            //console.log("LASER TRIP RISING DETECTED");
            laserTriggered();
        });
        console.log(">> Running Laser.js, configured as GROUP LEADER <<");
        standbyLed = PIN_LED_GRN;
      }
    })
  }

  else{
    PIN_LASER.unwatch(function(err){
      if (err) throw err;
    })
    PIN_LASER.unexport();
    console.log(">> Laser.js configured as GROUP MEMBER <<")
    standbyLed = PIN_LED_BLUE;
  }

  digitalWrite(standbyLed, 1); //standby LED on
}


//** what to do when a laser trip is detected **
function laserTriggered(){
  if(!triggerState){ //make sure we don't trigger a bunch of times in a row
    console.log("trip detected, triggering NOW");

    //TODO: SEND TRIGGER OBJECT TO SERVER HERE

    triggerState = true;
    digitalWrite(PIN_LED_RED, 1);
    digitalWrite(standbyLed, 0);

    setTimeout(function(){
       triggerState = false; //reset trigger
       digitalWrite(PIN_LED_RED, 0);
       digitalWrite(standbyLed, 1);
     },triggerBufferTime); //how long to wait between tiggers
   } else {
     console.log("trip detected during wait time");
   }
}


//**** TAKE A PICTURE !! ****
function hitShutter(){
  digitalWrite(PIN_SHUTTER, 1);
  setTimeout(function(){
     digitalWrite(PIN_SHUTTER, 0);
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
    method:'POST',
    headers:{
    'Content-Type': 'application/json',
    'Content-Length': objstring.length
    }
  }
  // also send to browser computer
  var req = http.request(options,function(res){

  })
  req.write(objstring)
  req.end()
}



process.on('SIGINT', function() {
  console.log(' Got SIGINT closing gpio')
  console.log(' Goodbye ')
  process.exit(0)
})
