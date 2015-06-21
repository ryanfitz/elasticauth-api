'use strict';

var _             = require('lodash'),
    Hoek          = require('hoek'),
    nodemailer    = require('nodemailer'),
    sesTransport  = require('nodemailer-ses-transport'),
    stubTransport = require('nodemailer-stub-transport'),
    Joi           = require('joi');

var internals = { };

internals.sendLoginEmail = function (config, transporter, log, account, auth, callback) {
  var subject = config.compiledSubject({account : account, auth : auth});
  var loginUrl = config.compiledLoginUrl({account : account, auth : auth});

  transporter.sendMail({
    from: config.fromAddress,
    to: account.email,
    subject: subject,
    text: loginUrl,
    html: '<a href=\"' + loginUrl + '\">Login</a>'
  }, function (err, info) {
    if(err) {
      log.info({err : err}, 'Failed to send login email');
      return callback(err);
    } else {
      log.info('Message sent: ' + info.response);
      return callback(null, info);
    }
  });
};

internals.createTransport = function(config) {
  if (config.transport === 'stub') {
    return nodemailer.createTransport(stubTransport());
  } else {
    return nodemailer.createTransport(sesTransport());
  }
};

internals.schema = Joi.object({
  fromAddress  : Joi.string().email().required(),
  subject : Joi.string().required(),
  loginUrl : Joi.string().required(),
  transport : Joi.string().allow('ses', 'stub').default('ses')
});

module.exports = function (config, logger) {
  config = config || {};

  var settings = _.merge({}, config);

  var results = Joi.validate(settings, internals.schema);
  Hoek.assert(!results.error, results.error);

  settings.compiledLoginUrl = _.template(settings.loginUrl);
  settings.compiledSubject = _.template(settings.subject);

  var transporter = internals.createTransport(settings);

  return {
    sendLoginEmail : _.partial(internals.sendLoginEmail, settings, transporter, logger),
  };

};
