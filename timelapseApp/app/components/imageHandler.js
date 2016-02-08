/***
*	Image File Handler
*
*/

var fs        = require('graceful-fs'),
	Flickr  		= require('./flickrUploader'),
	querystring = require('querystring'),
	http        = require('http'),
	path      	= require('path');



var handler = ImageHandler.prototype;

function ImageHandler(imgPath, cb){

	/* new File Handler instantiated after a file is added to watched folder */
	console.log(chalk.cyan('Begin Upload Image to Flickr:'), path.basename(imgPath));

	if(global.UPLOAD_FLAG)
		handler.uploadToFlickr(imgPath, cb);
	else cb(null, path.basename(imgPath), 'UPLOAD_FLAG set to false');
}

/***
*  UPLOAD this file to Flickr
*
*/
handler.uploadToFlickr = function(img, cb){

	var callb = cb;

	Flickr.uploadImage(img, path.basename(img), function(e, data){
		if(e) return callb(chalk.red.bold('error uploading to Flickr: ')+e);
		if(!data) return callb(chalk.red.bold('NO DATA RETURNED when uploading to Flickr: ')+e);
		console.log('uploadImage data: ', data);
		console.log('uploadImage data: ', JSON.stringify(data));
		callb(e, path.basename(img), JSON.parse(data));
		//callb(e, path.basename(img), JSON.parse(data));
	});
};


module.exports = ImageHandler;
