
var  _         = require('lodash'),
  async     = require('async'),
  fs        = require('graceful-fs'),
  later     = require('later'),
  schedule = require('node-schedule'),
  moment    = require('moment');

later.date.localTime();
var snapRecurring;

module.exports.init = function(snapFunc, cb){

  // snapRecurring = later.parse.recur().after('00:05').time().before('23:55').time().every(30).second().onWeekday();
  snapRecurring = later.parse.recur().after('00:01').time().before('23:59').time().every(20).second();
  var snapInterval    = later.setInterval(snapFunc, snapRecurring);
  var snapSchedule    = later.schedule(snapRecurring);

  cb( snapSchedule.nextRange(1, new Date())[0] );
};

module.exports.getTimeTilNextSnap = function(){

  var currSched = later.schedule(snapRecurring);
  return currSched.nextRange(1, new Date())[0];
};
