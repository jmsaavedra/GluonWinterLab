// var _ = require('lodash');
// var async = require('async');
// var mongoose = require('mongoose');
// var fs = require('fs');
// var lwip = require('lwip');

// var Images = mongoose.Schema({

//   path: String,
//   approved: { type: Boolean, default: false },
//   hearted: { type: Boolean, default: false },
//   take: Number,
//   camera: Number
// });

// Images.pre('save',function(next){

//   this.take = this.path.substr(0,this.path.indexOf('_'));
//   this.camera = this.path.substr(this.path.indexOf('_')+1,1);
//   next();
// });

// Images.methods.approve = function(cb){
//   var self = this;
//   self.approved = !self.approved;
//   self.copyFile('approve', function(e){
//     if(!e) self.save(cb);
//     else {
//       console.log("image copy error: ".red+e);
//       cb(e);
//     }
//   });
// };

// Images.methods.heart = function(cb){
//   var self = this;
//   self.hearted = !self.hearted;
//   self.copyFile('heart', function(e){
//     if(!e) self.save(cb);
//     else {
//       console.log("image copy error: ".red+e);
//       cb(e);
//     }
//   });
// };

// Images.methods.scale = function(cb){
//   var self = this;
//   self.copyFile('scale', function(e){
//     if(!e) self.save(cb);
//     else {
//       console.log("image copy error: ".red+e);
//       cb(e);
//     }
//   });
// };


// Images.methods.copyFile = function(copyType, cb){

//   var rawPath = global.RAW_IMG_FOLDER+'/'+this.path;
//   var outputPath;
//   var self = this;
//   switch(copyType){
//     case 'approve':
//       outputPath = global.APPROVED_FOLDER+'/'+self.path;
//       copyImage(rawPath, outputPath, cb);
//       break;
//     case 'heart':
//       outputPath = global.HEARTED_FOLDER+'/'+self.path;
//       copyImage(rawPath, outputPath, cb);
//       break;
//     case 'social':
//       outputPath = global.SOCIAL_FOLDER+'/'+self.path;
//       copyImage(rawPath, outputPath, cb);
//       break;
//     case 'scale':
//       outputPath = global.SCALED_IMG_FOLDER+'/'+self.path;
//       scaleImage(self, rawPath, outputPath, cb);
//       break;
//     default: //console.log('a change event occured:',arguments);
//       console.log('unknown copyType: '+copyType);
//       break;
//   }
// };

// var copyImage = function(_rawPath, _outputPath, cb){
//   fs.readFile(_rawPath, function (err, data) {
//       if (err) return cb(err);
//       fs.writeFile(_outputPath, data, function (_err) {
//           if (_err) return cb(_err);
//           cb(null);
//       });
//   });
// };


// var scaleImage = function(img, rawPath, outputPath, cb){
//   console.log("hit scaleImage: "+img.path);
//   //console.log("img.path: "+img.path);
//   lwip.open(rawPath, function(err, image){

//     image.batch()
//       .scale(0.15) //.rotate(45, 'white')  .crop(200, 200) .blur(5)
//       .writeFile(outputPath, function(err){
//         cb(err);
//     });
//   });
// };


// Images.statics.findOrCreate = function(files,callback){//function(query, sort, doc, options, callback){
//   var self = this;
//   this.collection.find({path:{$in:files}}).toArray(function(err,_files){
//     var created = false;
//     async.each(files,function(file,cb){
//       //check for images or create them.
//       var _img = _.find(_files,{path:file});
//       if(!_img){
//         self.create({path:file},function(err,res){
//             // _files.push(res);
//             created = true;
//             return cb();
//         });
//       } else return cb();
//     },function(err){
//       //console.log(_files);
//       if(created) return self.collection.find({path:{$in:files}}).toArray(callback);
//       return callback(err,_files);
//     });
//   });
// };

// module.exports = mongoose.model('Images', Images);
