
var _         = require('lodash'),
  async     = require('async'),
  fs        = require('fs'),
  moment    = require('moment'),
  gphoto2   = require('gphoto2'),
  GPhoto    = new gphoto2.GPhoto2();


/***
/* INIT Cameras
/*
*/
function Cameras(_cb){

  // var self = this;
  this.cameras_ = null;
  var self = this;

  GPhoto.list(function (list) {
    if (list.length === 0){
      console.log(chalk.red.inverse(" >>> NO CAMERAS FOUND <<< "));
      return _cb("no cameras found");
    }
    if (list.length < global.NUM_CAMERAS){
      console.log(chalk.red.inverse(" >>> NOT ALL CAMERAS FOUND <<< "));
      return _cb("only "+list.length+" cameras found!");
    }
    // var camera = list[0];
    self.cameras_ = list;

    var id=0;
    async.eachSeries(list, function(_thisCam, cb){
      var thisCam = _thisCam;
      thisCam.id=id;
      self.cameras_[id] = thisCam;
      console.log(chalk.cyan('Found Camera ')+id, chalk.gray('model'), thisCam.model, chalk.gray('on port'), thisCam.port);
      id++;
      cb();
    }, function(_e){
      if(_e) return _cb(_e);

        _cb(null);

      // this.takePhotos(function(er){
      //   _cb(er);
      // });
    });
  });
  return self;
}



/***
/* TAKE PHOTO on all cameras
/*
*/
Cameras.prototype.takePhotos = takePhotos = function(_cb){

  var self=this;
  var now = moment().format('YYYY-MM-DD_HH-mm-ss');
  // var now = moment().format('HH-mm-ss');

  async.each(this.cameras_, function(cam, cb){
    // console.log("take picture on cam: "+JSON.stringify(cam));

    cam.takePicture({
      download:true
      }, function (er, data) {

        if(!data){
          //var _thisCamIdx = _.findIndex(self.cameras_, { 'id': cam.id });
          //self.cameras_.splice(_thisCamIdx, 1);
          return cb("snap error: no image returned, camera: " + cam.id);
        }
        var filePath = global.RAW_IMG_FOLDER+'/gluon_winterlab_timelapse_'+now+'.jpg';
        //TODO: async!
        fs.writeFileSync(filePath, data);
        cb(er);
      });
    }, function(e){
    if(e) console.log(chalk.red("error taking snap: ") + e);
    _cb(e);
  });
};



module.exports = Cameras;
