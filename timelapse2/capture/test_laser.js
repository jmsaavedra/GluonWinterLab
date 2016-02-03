
/*LASER.JS

  Test to do ALL GPIO FUNCTIONALITY

  - Laser INPUT pin
*/


//**********************************//

//var HOST_IP = "192.168.0.42"
// var HOST_IP = "192.168.0.3"
// var PORT    = "1234"

//**********************************//

var Gpio = require('onoff').Gpio;
// var WebSocket = require('ws') //*******
// var os = require('os')
// var fs = require('fs')
var exec = require('child_process').exec
// var ws = new WebSocket('ws://'+HOST_IP+':'+PORT);//**********

//all should be configured to OUT except for pin 23.
var PIN = [23, 4, 17, 24, 27, 25, 22];

for(var i=0; i<PIN.length; i++){
  var strExec; //string to execute
  if(i<1) strExec = 'gpio export '+PIN[i]+ ' in';
  else strExec = 'gpio export '+PIN[i]+ ' out';
  console.log("running: "+strExec);
  var child = exec(strExec,function(error,stdout,stderr){
    if(error) console.log("GPIO ERROR: "+error);
  })
}



//*** VARS
var groupLeader = true;
var triggerState = 0; //prevent false triggers
var triggerBufferTime = 1500; //how long to wait before next trigger


//*** SETUP PINS
var PIN_LASER     = new Gpio(PIN[0], 'in', 'rising');//'both');
var PIN_SHUTTER   = new Gpio(PIN[1], 'out');
var PIN_AF        = new Gpio(PIN[2], 'out');
var PIN_LED_RED   = new Gpio(PIN[3], 'out');
var PIN_LED_GRN   = new Gpio(PIN[4], 'out');
var PIN_LED_BLUE  = new Gpio(PIN[5], 'out');
var PIN_LED_3MM   = new Gpio(PIN[6], 'out');
var standbyLed    = PIN_LED_GRN;

digitalWrite(standbyLed, 1);

setTimeout(function(){
   configLaser(groupLeader); //config as default
 },1000); //wait a second for Gpio(pin) to config first


(function blink(count) {
    // if (count <= 0) return led.unexport();

    PIN_LASER.read(function(err, value) {  // Asynchronous read.
        if (err) throw err;
        console.log("read val: "+ value);
        // led.write(value === 0 ? 1 : 0, function(err) { // Asynchronous write.
        //     if (err) throw err;
        // });
    });

    setTimeout(function() {
        blink(count - 1);
    }, 200);
})(2000);


// var networkInterfaces = os.networkInterfaces() //*************
// console.log(networkInterfaces)
//
// var ipAddress = '';
// if(networkInterfaces.hasOwnProperty('eth0')){
//   ipAddress = networkInterfaces.eth0[0].address
// }else{
//   ipAddress = 'undefined'
// }

// ** OPEN WEBSOCKET **
// ws.on('open', function() {
//   var obj = {'address':ipAddress}
//   console.log(obj)
//   ws.send(JSON.stringify(obj));
// });
//
//
// //** WEBSOCKET MESSAGE HANDLING **
// ws.on('message', function(data, flags) {
//
//   if(data == 'close'){
//     var child = exec('echo raspberry | sudo shutdown -h now',function(error,stdout,stderr){
//       console.log('stdout: '+stdout)
//       console.log('stderr: '+stderr)
//     })
//   }
//
//   else if(data == 'toggleleader'){
//     configLaser(!groupLeader);
//   }
// });

//** CONFIGURE LASER **
//can be set through /toggleleader route currently
function configLaser(job){
  groupLeader = job;
  digitalWrite(standbyLed, 0);

  if(groupLeader){ //watch sensor!

    //** set watch with callback on laserpin RISING
    PIN_LASER.watch(function(err, value) {
        console.log("LASER TRIP RISING DETECTED");
        if(err) console.log(err);
        laserTriggered();
    });
    console.log(">> Running Laser.js, configured as GROUP LEADER <<");
    standbyLed = PIN_LED_GRN;
  }

  else{
    PIN_LASER.unwatch(function(err){
      if (err) throw err;
    })
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
    hitShutter();
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

//** digitalWrite function
function digitalWrite(pin, state){
  pin.write(state, function(err) { // Asynchronous write.
    //pin.write(value === 0 ? 1 : 0, function(err) {
      if (err) throw err;
  });
}


//** close on quit
process.on('SIGINT', function() {
  console.log(' Got SIGINT closing gpio');
  digitalWrite(PIN_LED_GRN, 0);
  digitalWrite(PIN_LED_RED, 0);
  digitalWrite(PIN_LED_BLUE, 0);
  console.log(' Goodbye ');
  process.exit(0)
})
