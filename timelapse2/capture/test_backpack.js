


/* CAPTURE.JS

  - receives 'go' from trigger server
  - toggles SHUTTER and AF gpio pins
  - sends cameraPost to server after photo is taken
*/

//**********************************//

// var BROWSER_IP = "192.168.0.4" //TRUE
// var TRIGGER_IP = "192.168.0.3" //TRUE
// var BROWSER_IP = "192.168.0.42"
// var TRIGGER_IP = "192.168.0.42"
// var TRIGGER_PORT    = "1234"

//**********************************//

var Gpio = require('onoff').Gpio;
var exec = require('child_process').exec;

//*** VARS
var groupLeader = true;


//all should be configured to OUT except for pin 23.
var PIN = [23, 4, 17, 24, 27, 25, 22];

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
var PIN_LED_3MM   = new Gpio(PIN[6], 'out');

var GPIO_out=         [PIN_SHUTTER, PIN_AF, PIN_LED_RED, PIN_LED_GRN, PIN_LED_BLUE, PIN_LED_3MM];
var GPIO_out_strings= ['PIN_SHUTTER', 'PIN_AF', 'PIN_LED_RED', 'PIN_LED_GRN', 'PIN_LED_BLUE', 'PIN_LED_3MM'];

// var GPIO_out = [PIN_SHUTTER];
// var GPIO_out = ['PIN_SHUTTER'];

var standbyLed    = PIN_LED_BLUE;

var testPin = 0; //0 is laser

// setTimeout(function(){
//    configLaser(groupLeader); //config as default
//  },1000); //wait a second for Gpio(pin) to config first

for(var i=0; i< 100000; i++){
  sleep(800, function(){
    digitalWrite(PIN_SHUTTER, 1);
    sleep(800,function(){
      digitalWrite(PIN_SHUTTER, 0);
    })
  })

  sleep(800, function(){
    digitalWrite(PIN_AF, 1);
    sleep(800,function(){
      digitalWrite(PIN_AF, 0);
    })
  })

  sleep(25, function(){
    digitalWrite(PIN_LED_RED, 1);
    sleep(1000,function(){
      digitalWrite(PIN_LED_RED, 0);
    })
  })

  sleep(25, function(){
    digitalWrite(PIN_LED_GRN, 1);
    sleep(1000,function(){
      digitalWrite(PIN_LED_GRN, 0);
    })
  })

  sleep(25, function(){
    digitalWrite(PIN_LED_BLUE, 1);
    sleep(1000,function(){
      digitalWrite(PIN_LED_BLUE, 0);
    })
  })

  sleep(25, function(){
    digitalWrite(PIN_LED_3MM, 1);
    sleep(1000,function(){
      digitalWrite(PIN_LED_3MM, 0);
    })
  })

}

// for(var j=0; j<1000; j++){
//   sleep(1000, function() {
//      test(GPIO_out, testPin)
//      console.log("go: "+ GPIO_out_strings[testPin]);
//    }
//   );
// }

function test(gpiopins, num){
  digitalWrite(gpiopins[num], 1);
   if(testPin > gpiopins.length-1)testPin = 0;
   sleep(1000, function(_testPin){
     digitalWrite(gpiopins[num], 0);
     _testPin++;
   })
}

function sleep(time, callback) {
    var stop = new Date().getTime();
    while(new Date().getTime() < stop + time) {
        ;
    }
    callback();
    // test(GPIO_out, testPin);
}

//** CONFIGURE LASER **
//can be set through /toggleleader route currently
function configLaser(job){
  groupLeader = job;
  digitalWrite(standbyLed, 0);

  if(groupLeader){ //watch sensor!

    var strExec = 'gpio export ' +PIN_LASER+ ' in';
    //var child = exec(strExec,function(error,stdout,stderr){
    //  if(error) console.log("GPIO ERROR: "+error);
    //  else {
        //** set watch with callback on laserpin RISING
        PIN_LASER.watch(function(err, value) {
            console.log("LASER TRIP DETECTED");
            laserTriggered();
        });
        console.log(">> Running Laser.js, configured as GROUP LEADER <<");
        standbyLed = PIN_LED_GRN;
      //}
    //})
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

    hitShutter();

    setTimeout(function(){
       triggerState = false; //reset trigger
       digitalWrite(PIN_LED_RED, 0);
       digitalWrite(standbyLed, 1);
     },triggerBufferTime); //how long to wait between tiggers
   } else {
     console.log("trip detected during wait time");
   }
}

//** digitalWrite function
function digitalWrite(pin, state){
  pin.write(state, function(err) { // Asynchronous write.
    //pin.write(value === 0 ? 1 : 0, function(err) {
      if (err) throw err;
  });
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
