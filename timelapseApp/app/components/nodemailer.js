/***
* nodemailerClient.js
*
*
*/

var nodemailer = require('nodemailer');
var wellknown = require('nodemailer-wellknown');

var MAILER_KEYS = global.KEYS.NODEMAILER;

var transporter = nodemailer.createTransport({

	service: MAILER_KEYS.service,
	auth: {
    	user: MAILER_KEYS.user,
    	pass: MAILER_KEYS.pass
	}
});

var Mailer = {

	sendEmail: function(subject, body, cb){
		var email = {
			from: MAILER_KEYS.OPTIONS.fromCam,
		    to: MAILER_KEYS.OPTIONS.to,//'joe.m.saavedra@gmail.com',
		    subject: subject,
		    text: body
		};

		transporter.sendMail(email, function(e, info){
			cb(e, info);
		});
	}
};

module.exports = Mailer;


