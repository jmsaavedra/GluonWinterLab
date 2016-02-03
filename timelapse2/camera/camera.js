/*
CAMERA.JS

*/

//**********************************//
//**********************************//

var DOWNLOAD_IP  = "192.168.0.2"
var BROWSER_IP   = "192.168.0.2"
var VERSION      = "RC 5.6.3 > IE6"

//**********************************//
//**********************************//

var Gpio = require('onoff').Gpio;
var spawn = require('child_process').spawn;
var exec  = require('child_process').exec;
var restler = require('restler');
var fs = require('fs');
var url = require('url');
var http = require('http');

//** VARS **//
var downloadURL = "http://"+ DOWNLOAD_IP +":3001/";
var settingsFile = __dirname + '/settings.json';
var settingsData = {};
var currentTake = null;

//*** GPIO PINS ***//
// [SHUTTER, AF, RED, GREEN, BLUE, 3MM, LASER]
var PIN = [4, 17, 24, 27, 25, 22, 23];
var bConnected = false; //only turn false on ** ERROR received
var bPinsInited = false;
var bAttemptedReconnect = false;

var PIN_SHUTTER;
var PIN_AF;
var PIN_LED_RED;
var PIN_LED_GRN;
var PIN_LED_BLUE;
var PIN_LED_3MM;

//*** set permissions to local scripts ***//
var chmodx = exec('chmod -x ~/piFirmware/camera/gpioExport.sh && chmod -x ~/piFirmware/camera/gitpull.sh',
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
      PIN_LED_3MM   = new Gpio(PIN[5], 'out');
      console.log("GPIO pins exported and inited");
      bPinsInited = true;
    }else{
      console.log("error: "+error)
      console.log("stdout: "+stdout)
      console.log("stderr: "+stderr)
    }
  }
);


//*** remove any jpg at the root level of the pi ***//
var rm = exec('rm -rf ~/*.jpg',function(error,stdout,stderr){
  console.log('deleted all jpeg files in home directory')
})

console.log("WELCOME TO "+VERSION);


//Init routine
init(function(status){
  console.log("INIT COMPLETE, CONNECTION STATUS: "+status);
})


//*** TETHER TO CAMERA ***//
var tether = new Tether();


//**** SET SETTINGS VALUE OF CANON ****//
function setCameraConfigValue(key,val,cb){
  console.log('gphoto2 --set-config-index '+key+"="+val)
  var child = exec('gphoto2 --set-config-index '+key+"="+val,function(error, stdout, stderr){

    if(!error && !stderr){
      var obj = {}
      obj[key] = val
      console.log("setCameraConfig turn red OFF")
      redLeds(0);

      //-- update settings file
      fs.readFile(settingsFile,'utf8',function(err,data){
        if(err) console.log(err)
        else{
          settingsData = JSON.parse(data)
          settingsData[key] = val;
          console.log(JSON.stringify(settingsData))
          saveSettings(settingsData);
        }
      })
      cb(null,JSON.stringify(obj))
    }else{
      console.log("setCameraConfig turn red ON")
      redLeds(1);
      cb(stderr)
    }
    console.log('restarting tethered')
  })
}


//**** GET SETTINGS VALUE FROM CANON ****//
function getCameraConfigValue(key,cb){

  console.log('gphoto2 --get-config '+key)
  var child = exec('gphoto2 --get-config '+key,function(error, stdout, stderr){

    if(!error && !stderr){
      var string = stdout.toString()
      var currentLoc = string.indexOf('Current:')+9
      var end = string.indexOf('\n',currentLoc)
      var value = string.substr(currentLoc,end-currentLoc)
      var obj = {}
      obj[key] =value
      console.log("getCameraConfig turn red OFF")
      redLeds(0);
      cb(null,JSON.stringify(obj))
    }else{
      console.log("getCameraConfig turn red ON")
      redLeds(1);
      cb(stderr)
    }
  })
}



//*** TETHER TO CANON ****
function Tether(){

  var _this = this

  this.start = function(){
  		console.log("Starting tether");
      tethered =  spawn('gphoto2', ['--capture-tethered'])
      console.log("tether start red OFF")
      redLeds(0);
      bConnected = true;

      //* info *//
      tethered.stdout.on('data',function(data){
        console.log("tethered.stdout.data: ")
        console.log(data.toString())
        var string = data.toString()

        if(string.indexOf("Overwrite? [y|n] ") >-1){
          console.log("writing y")
          tethered.stdin.write('y\n')
        }
        console.log("tether stdout red OFF")
        redLeds(0);
        bConnected = true;
      })

      //* got somethinggggg *//
      tethered.stderr.on('data',function(data){
        var string = data.toString()
        if(string.indexOf('.jpg')>-1){
          console.log("tether stderr red OFF")
          redLeds(0);
          bConnected = true;
          if(string.indexOf('Deleting')>-1){
            console.log('Detected Photo')
            var s = string.indexOf("'")
            var e = string.indexOf("'",s+1);
            //get the filename by finding the first and second '
            var filename = string.substr(s+1,e-s-1)
            console.log("Found file: "+filename)
            handleFile(filename, currentTake);
          }
        }else if(string.indexOf('*** Error')>-1){
          bConnected = false;
          console.log("tether ERROR red ON")
          redLeds(1);
          if(!bAttemptedReconnect){ //if we haven't tried reconnecting yet
            reconnect(function(){
              bAttemptedReconnect = true;
            }); //try to reconnect
          }
          console.error(string)
        }
      }) //end stderr.on(data)

      //* tether closed *//
      tethered.on('close',function(code){
        console.log("tether close red ON")
        redLeds(1);
        bConnected = false;
        console.log('Closed Tethered with code: '+code)
      })
      this.kill = function(){
          console.log('killing tethering')
          tethered.kill("SIGTERM")
      }
      return tethered
  }
  this.kill = function(){
    _this.tethered.kill()
  }
  this.tethered = this.start()
}

//**** hit shutter, take picture ****
function hitShutter(){
  digitalWrite(PIN_SHUTTER, 1);
  digitalWrite(PIN_LED_BLUE, 1);
  digitalWrite(PIN_LED_GRN, 0);
  digitalWrite(PIN_LED_RED, 0);
  console.log("hitShutter");
  setTimeout(function(){
     digitalWrite(PIN_SHUTTER, 0);
     digitalWrite(PIN_LED_BLUE, 0);
     digitalWrite(PIN_AF, 0);
  },300); //button press duration
}

function setReady(){
  digitalWrite(PIN_AF, 1);
  digitalWrite(PIN_LED_GRN, 1);
  console.log("setReady");
}

//**** half-press for Auto-Focus ****
function hitAutoFocus(){
  digitalWrite(PIN_AF, 1);
  console.log("hitAutoFocus");
  setTimeout(function(){
     digitalWrite(PIN_AF, 0);
  },300); //button press duration
}

function redLeds(state){
  digitalWrite(PIN_LED_RED, state);
  digitalWrite(PIN_LED_3MM, state);
  if(state == 1) digitalWrite(PIN_LED_GRN, 0); //only LED that might be on (laserEnabled)
}

//**** digitalWrite function ****
function digitalWrite(pin, state){
  if(bPinsInited){
    pin.write(state, function(err) { // Asynchronous write.
    //pin.write(value === 0 ? 1 : 0, function(err) {
      if (err) throw err;
    });
  } else console.log("PIN NOT INITED: "+pin);
}

//*** wake camera up, start up tether ***//
function reconnect(callback){
  console.log(">> attempting reconnect to camera");
	hitAutoFocus();
	setTimeout(function(){
    hitAutoFocus()
    setTimeout(function(){
      tether.start()
        setTimeout(function(){callback()},1000);
      },1000);
  }, 1000);
}

//**** HANDLE FILE ****
function handleFile(filename, _currentTake){
  //delete file
  //pass file back to processing server
  // if(currentTake !== null){
    var postURL = (_currentTake !== null)? downloadURL + _currentTake: downloadURL;
    console.log("handleFile hit, currentTake= "+_currentTake + ", postURL = "+postURL);
    fs.stat(filename, function(err, stats) {
      fs.writeFile(__dirname+'/img_'+_currentTake+'.jpg', filename, function(e){
        if(e) console.log("error writeFile:", e);
      });
      // console.log("posting to: "+ postURL);
      // restler.post(postURL, {
      //     multipart: true,
      //     data: {
      //         "id": "0",
      //         "image": restler.file(filename, null, stats.size, null, "image/jpg")
      //     }
      // }).on("complete", function(data) {
      //     console.log("Received: "+JSON.stringify(data))
      //     //delete file
      //     fs.unlink(filename, function(e){
      //       console.log("Deleted :"+filename)
      //   	})
      // })
    });
  // }
}

//*** reboot ***//
function reboot(){
  console.log('sending system reboot now. Good-bye')
  var reboot = exec("echo pi | sudo reboot",function(error, stdout, stderr){
    console.log('going down for a reboot')
  })
}

/*** INIT THE CAMERA ***/
function init(callback){
  console.log("Camera Init")

  fs.exists(settingsFile, function(exists){
    if(exists){ //we have a serial file
      console.log("found settings file");
      fs.readFile(settingsFile,'utf8',function(err,data){
        if(err) console.log(err)
        else{
          settingsData = JSON.parse(data)
          settingsData.piFirmware_version = VERSION;
          //if(settingsData.hasOwnProperty('piFirmware_version')){
          //  settingsData.piFirmware_version = VERSION;
          //}else settingsData.piFirmware_version = VERSION
          if(settingsData.hasOwnProperty('serial')){
            //do nothing
          }else settingsData.serial = "NaN"
          console.log(JSON.stringify(settingsData))
          saveAndReport(settingsData, function(status){
            callback(status);
          })
        }
      })
    }else{//no serial file
      console.log("SETTINGS.js NOT FOUND. creating settings file:");
      var mySettings = {
        "piFirmware_version":VERSION,
        "serial": "NaN"
      }
      saveAndReport(mySettings, function(status){
        callback(status);//res.end(JSON.stringify({"init":"running", "connection_status":status}))
      })
    }
  })
}

//*** SAVE SETTINGS on boot or later when received from server ***//
function saveSettings(newSettings){
  fs.writeFile(settingsFile, JSON.stringify(newSettings), function(err){
    if(err) console.log("err in saveSettings: "+err);
    else console.log("saved settings file!");
  });
}

function saveAndReport(settingsData, cb){
   console.log(settingsData);
   //check for serial number from camera
    tether.kill();
    getCameraConfigValue('eosserialnumber',function(err,val){
    if(!err){
      //WE ARE CONNECTED TO THE CAMERA !!
      var data = JSON.parse(val)
      settingsData.serial = data.eosserialnumber;
      console.log(settingsData)
      saveSettings(settingsData)
      //make request to browser
      restler.postJson('http://'+BROWSER_IP+':3000/camera', settingsData).on('complete',function(data, response){
        // handle response
        console.log(data)
      });
      cb(true);
    }else{
      console.log(err)
      if(settingsData.serial == "NaN" ) saveSettings(settingsData)
      restler.postJson('http://'+BROWSER_IP+':3000/camera', settingsData).on('complete',function(data, response){
        //handle response
        console.log(data)
      });
      cb(false);
    }
  	tether.start()
  })
}



//*** CREATE SERVER on port 8080 ***//
http.createServer(function (req, res) {
  //console.log('got request')
  var url_parts = url.parse(req.url, true);
  //console.log(url_parts)
  var query = url_parts.query;
  keys = Object.keys(url_parts.query)
  if(url_parts.pathname ==  '/favicon.ico'){
    res.writeHead(400,{'Content-Type':'application/json', 'Access-Control-Allow-Origin': '*'})
    res.end('Not for you')
  } else {
    res.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'})

    //*** change camera configuration/setting ***//
    if(url_parts.pathname == '/set'){
      tether.kill();
      setCameraConfigValue(keys[0],url_parts.query[keys[0]],function(err,val){
        var response =''
        if(!err){
          response = val
          reconnect(function(){});
        }
        else response = JSON.stringify({"error":err})
        res.end(response)
      })
    }

    //*** change camera configuration/setting ***//
    else if(url_parts.pathname == '/get'){
      tether.kill();
      getCameraConfigValue(url_parts.search.substr(1),function(err,val){
        var response =''
        if(!err){
          response = val
          reconnect(function(){});
        }
        else response = JSON.stringify({"error":err})
        res.end(response)
       })
    }

    //*** get just the version ***// (legacy. to be deprecated by /status)
    else if(url_parts.pathname == '/version'){
      res.end(JSON.stringify({"version":VERSION}));
    }

    //*** run init ***//
    else if(url_parts.pathname == '/init'){
      init(function(status){
        console.log("init status returned: "+status);
      })
    }

    //*** run gitpull ***//
    else if(url_parts.pathname =='/gitpull'){
      console.log('attemping git pull')
      child = exec('expect ~/piFirmware/camera/gitpull.sh',
      function(error,stdout,stderr){
          if(!error && !stderr){
            //console.log('git pull success')
            res.end(JSON.stringify({"Success":"Git Pull"}))
            reboot()
            console.log(stdout)
          }else{
            console.log(error)
            console.log(stderr)
            res.end(JSON.stringify({"Error":"Git Pull", "details":{error:error,stderr:stderr}}))
          }
      })
    }

    //*** sudo shutdown ***//
    else if(url_parts.pathname=='/shutdown'){
      res.end(JSON.stringify({"shutdown":"received"}));
      var child = exec('echo pi | sudo shutdown -h now',function(error,stdout,stderr){
        console.log('stdout: '+stdout);
        console.log('stderr: '+stderr);
      })
    }

    //*** sudo shutdown ***//
    else if(url_parts.pathname=='/reboot'){
      res.end(JSON.stringify({"reboot":"received"}));
      reboot();
    }

    //*** take picture ***//
    else if(url_parts.pathname == '/trigger'){
      hitShutter();
      res.end(JSON.stringify({"trigger":"received"}));
    }

    //*** report status and all settings ***// UPDATE ME!!!
    else if(url_parts.pathname == '/status'){

      res.end(JSON.stringify({"status":bConnected, "settings":settingsData}));
    }

    //*** getcho tether on ***//
    else if(url_parts.pathname == '/reconnect'){
      if(bConnected){
        res.end(JSON.stringify({"reconnect":bConnected}))
      }else{
        reconnect(function(){
          res.end(JSON.stringify({"reconnect":bConnected}))
        })
      }
    }

    //*** refresh local settings object from file***//
    else if(url_parts.pathname == '/settings'){
      fs.readFile(settingsFile,'utf8',function(err,data){
        if(err) console.log(err)
        else{
          settingsData = JSON.parse(data)
          res.end(JSON.stringify({"settings":settingsData}))
        }
      })
      //res.end(JSON.stringify({"settings":settingsData}))
    }

    else if(url_parts.pathname == '/laser'){ //  ...xxx:8080/laser?set=0  or 1
      var laserEnable = parseInt(url_parts.query[keys[0]]);
      console.log("setting laserEnable to ");
      console.log(laserEnable)
      settingsData.laser_enable = laserEnable;
      saveSettings(settingsData);
      var update = {settings:settingsData}
      res.end(JSON.stringify({"laser_enable: ":laserEnable}));
    }

    else if(url_parts.pathname == '/laserlocal'){  // ...xxx:8080/laserlocal?set=0  or 1
      var laserLocal = parseInt(url_parts.query[keys[0]]);
      console.log("setting laser_local to: ");
      console.log(laserLocal);
      settingsData.laser_local = laserLocal;
      saveSettings(settingsData);
      var update = {settings:settingsData}
      res.end(JSON.stringify({"laser_local":laserLocal}));
    }

    else if(url_parts.pathname == '/multicast'){  // ...xxx:8080/multicast?set=0  or 1
      var multi = parseInt(url_parts.query[keys[0]]);
      console.log("setting multicast to: ");
      console.log(multi);
      settingsData.multicast = multi;
      saveSettings(settingsData);
      var update = {settings:settingsData}
      res.end(JSON.stringify({"multicast":multi}));
    }

    else if(url_parts.pathname == '/arm'){
      currentTake = url_parts.query[keys[0]];
      console.log("set arm, take: "+ currentTake);
      setReady();
      res.end(JSON.stringify({"arm":true, "status":bConnected, "current_take":currentTake}));
    }

    else if(url_parts.pathname == '/disarm'){
      currentTake = null;
      console.log("set disarm, currentTake=null");
      res.end(JSON.stringify({"arm": false, "status":bConnected, "current_take":currentTake}));
    }


    //*** moron ***//
    else{
      res.end(JSON.stringify({error:"unrecognized"}))
    }
  }
}).listen(8080);
console.log('Server running at 8080');
