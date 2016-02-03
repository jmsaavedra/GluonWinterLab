/***** GLUON TIMELAPSE AUTH KEYS ******
*
*  TO USE: copy/paste into 'AuthKeys.js', and place in top/root level dir of this repo.
*
*   var path = require('path');   //cross-platform compatibility
*     global.KEYS = require(path.join(__dirname, '..', 'AuthKeys'));
*
*  NOTE: Do not commit to git!
*
*/

module.exports = {

  /** FLICKR **/
  'FLICKR':{
    'key': 'somekey',
    'secret': 'somesecret'
  },

  /** ROUTING SERVER **/
  'TIMELAPSE_SERVER' : {
    'host'  : 'http://somehost.net',
    'port'  : '8080',

    'PATH' : {
      'photo_info': '/photo/info',
      'photo' : '/photo/new',
      'video' : '/timelapse/new',
    }
  },

  /** NODEMAILER **/
  'NODEMAILER' : {
    'service' : 'Gmail',
    'user'    : 'someemail@gmail.com',
    'pass'    : 'yourpass',

    'OPTIONS' : {
      'fromCam' : '[TimelapseApp] Camera Controller App <someemail@gmail.com>',
      'to'    : 'youremail@email.com'
    }
  }
};