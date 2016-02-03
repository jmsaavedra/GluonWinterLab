
var BROADCAST_IP = "192.168.0.255"//"192.168.0.255"
var MULTICAST_IP = "230.185.192.108"
var SEND_LASER_IP = "192.168.0.199" //STUART
var SEND_LASER_PORT = 7999
var TRIGGER_IP = "192.168.0.3" //TRUE IP
var BROWSER_IP = "192.168.0.2"

var PORT = 41234

/* NODE JS INCLUDES */
var Gpio = require('onoff').Gpio;
var http = require('http')
var fs = require('fs')
var exec = require('child_process').exec
var dgram = require("dgram")

//* VARS *//
var serialNumber;
//[SHUTTER, AF, RED, GRN, BLUE, 3MM, LASER]
var PIN = [4, 17, 24, 27, 25, 22, 23];
var picCt = 0;
var laserEnable = false;
var laserLocal = false;
var triggerCt = 0;
var triggerState = 0; //prevent false triggers
var triggerBufferTime = 1500; //how long to wait before next trigger
var bPinsInited = false;

var multicast = false;

var PIN_SHUTTER
var PIN_AF
var PIN_LED_GRN
var PIN_LED_BLUE
var PIN_LASER

//for settings file
var settingsFile = __dirname + '/../camera/settings.json';
var settingsData;


//*** set permissions to local scripts ***//
var chmodx = exec('chmod -x ~/piFirmware/camera/gpioExport.sh',
function(error,stdout,stderr){
  console.log('set chmod to all scripts');
})


//*** EXECUTE EXPORT GPIO PIN SCRIPT ***//
child = exec('bash ~/piFirmware/camera/gpioExport.sh',
  function(error,stdout,stderr){
    if(!error && !stderr){

      //*** SETUP PINS ***//
      PIN_SHUTTER   = new Gpio(PIN[0], 'out');
      PIN_AF        = new Gpio(PIN[1], 'out');
      PIN_LED_RED   = new Gpio(PIN[2], 'out');
      PIN_LED_GRN   = new Gpio(PIN[3], 'out');
      PIN_LED_BLUE  = new Gpio(PIN[4], 'out');
      PIN_LASER     = new Gpio(PIN[6], 'in', 'rising');
      console.log("GPIO pins exported and inited");
      bPinsInited = true;
    }else{
      console.log("error: "+error)
      console.log("stdout: "+stdout)
      console.log("stderr: "+stderr)
    }
  }
);

//LOOK FOR SETTINGS FILE
fs.exists(settingsFile, function(exists){
  if(exists){ //we have a serial file
    console.log("found settings file");
    fs.readFile(settingsFile,'utf8',function(err,data){
      if(err) console.log(err)
      else{
        settingsData = JSON.parse(data)
        // configLaser(laserEnable);
        if(settingsData.hasOwnProperty('laser_enable')){
          laserEnable = parseInt(settingsData.laser_enable);
          configLaser(laserEnable);
        }
        if(settingsData.hasOwnProperty('laser_local')){
          laserLocal = parseInt(settingsData.laser_local);
        }
        if(settingsData.hasOwnProperty('multicast')){
          multicast = parseInt(settingsData.multicast);
        }
        console.log("capture read settings file as::: ");
        console.log(JSON.stringify(settingsData))
      }
    })
  }else{//no serial file
    settingsData = {}; //just make an empty object
    //do nothing. camerajs creates if needed.
  }
})


//** CONFIGURE LASER **
function configLaser(job){
  console.log("hit configLaser, job: "+job);
  laserEnable = job;
  digitalWrite(PIN_LED_BLUE, 0);
  digitalWrite(PIN_LED_RED, 0);

  if(laserEnable){ //watch sensor!
    //** set watch with callback on laserpin RISING
    PIN_LASER.watch(function(err, value) {
        //console.log("LASER TRIP RISING DETECTED");
        laserTriggered();
    });
    console.log(">> configured laser is ENABLED <<");
    setTimeout(function(){
      digitalWrite(PIN_LED_BLUE, 1);
      digitalWrite(PIN_LED_RED, 1);

      setTimeout(function(){
         digitalWrite(PIN_LED_BLUE, 0);
         digitalWrite(PIN_LED_RED, 0);

      },10000); //how long to blink for
    }, 1000); //wait a second and flash green for 5 seconds
  } else {
    console.log(">> configured laser DISABLED");
    digitalWrite(PIN_LED_BLUE, 0);
    digitalWrite(PIN_LED_RED, 0);
    //PIN_LASER.unexport(); //**ONLY IF WE ARE NOT A LEADER**
  }
}


//** LASERTRIGGERED - what to do when a trip is detected **
function laserTriggered(){
  if(!triggerState && laserEnable){ //make sure we don't trigger a bunch of times in a row

    //*** REPORT TRIGGER OBJECT TO SERVER HERE
    var message = new Buffer("1");
    client.send(message,0,message.length,SEND_LASER_PORT,SEND_LASER_IP,function(err,bytes){
      if(err) console.log("error sending laser trip: "+err);
      else console.log("sent laser message");
    })

    triggerCt++;
    console.log("trip detected, count: "+triggerCt);
    triggerState = true
    if(laserLocal) hitShutter();
    digitalWrite(PIN_LED_BLUE, 1);
    digitalWrite(PIN_LED_RED, 1);
    // digitalWrite(standbyLed, 0);
    setTimeout(function(){
       triggerState = false; //reset trigger
       digitalWrite(PIN_LED_BLUE, 0);
       digitalWrite(PIN_LED_RED, 0);
      //  digitalWrite(standbyLed, 1);
     },triggerBufferTime); //how long to wait between tiggers
   } else {
     console.log("trip detected during wait time");
   }
}



/*** UDP CLIENT/SERVER CONNECTION***/
var client = dgram.createSocket("udp4")

var message = new Buffer("hello world")

client.on("message", function (msg, rinfo) {

  if(msg == "go"){
    hitShutter(); //*** TAKE PICTURE !!
  }
  else if(msg == "arm"){
    armAutoFocus();
  }
  else if(msg == "laser1"){
    laserEnable = 1;
    configLaser(1);
  }
  else if(msg == "laser0"){
    laserEnable = 0;
    configLaser(0);
  }
  else if(msg == "laserlocal1"){
    laserLocal = 1;
  }
  else if(msg == "laserlocal0"){
    laserLocal = 0;
  }
});


client.on("listening", function () {
  client.setBroadcast(true)

  if(multicast){
    client.setMulticastTTL(2);
    client.addMembership('230.185.192.108');
  }

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

client.bind(41234);


//**** TAKE A PICTURE !! ****
function hitShutter(){
  digitalWrite(PIN_SHUTTER, 1);
  digitalWrite(PIN_LED_BLUE, 1);
  digitalWrite(PIN_LED_GRN, 0);
  digitalWrite(PIN_LED_RED, 0);
  console.log("capture hitShutter");
  setTimeout(function(){
     digitalWrite(PIN_SHUTTER, 0);
     digitalWrite(PIN_AF, 0);
     digitalWrite(PIN_LED_BLUE, 0);
     digitalWrite(PIN_LED_GRN, 0);
   },300); //button press duration
}

function armAutoFocus(){
  digitalWrite(PIN_AF, 1);
  digitalWrite(PIN_LED_GRN, 1);
  console.log("udp armAutoFocus");
}

//**** half-press for Auto-Focus
function hitAutoFocus(){
  digitalWrite(PIN_AF, 1);
  console.log("udp hitAutoFocus");
  setTimeout(function(){
     digitalWrite(PIN_AF, 0);
  },300); //button press duration
}

//** digitalWrite function
function digitalWrite(pin, state){
  if(bPinsInited){
      pin.write(state, function(err) { // Asynchronous write.
    //pin.write(value === 0 ? 1 : 0, function(err) {
        if (err) throw err;
    });
  } else console.log("PIN NOT INITED: "+pin);
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


//*** SAVE SETTINGS on boot or later when received from server ***//
function saveSettings(newSettings){
  fs.writeFile(settingsFile, JSON.stringify(newSettings), function(err){
    if(err) console.log("err in saveSettings: "+err);
    else console.log("saved settings file!");
  });
}


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
