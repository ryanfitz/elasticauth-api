'use strict';

var _    = require('lodash'),
    AWS  = require('aws-sdk'),
    Joi  = require('joi');

var internals = {
  cognitoIdentity : new AWS.CognitoIdentity({apiVersion: '2014-06-30'})
};

internals.createToken = function (config, log, account, callback) {
  var logins = {};
  logins[config.developerProviderName] = account.id;

  var params = {
    IdentityPoolId: config.identityPoolId,
    Logins: logins,
  };

  internals.cognitoIdentity.getOpenIdTokenForDeveloperIdentity(params, function(err, data) {
    if (err) {
      log.info({err : err}, 'Failed to create cognito token');
      return callback(err);
    } else {
      return callback(null, {cognitoId : data.IdentityId, cognitoToken : data.Token});
    }
  });
};

internals.schema = Joi.object({
  identityPoolId        : Joi.string().required(),
  developerProviderName : Joi.string().required()
});

internals.emptyCreateToken = function (account, callback) {
  return callback();
};

module.exports = function (config, logger) {
  config = config || {};

  var result = Joi.validate(config, internals.schema);

  if (result.error) {
    logger.info('Cognito not configured, skipping cognito integration');
    return { createToken : internals.emptyCreateToken };
  }

  return {
    createToken : _.partial(internals.createToken, config, logger),
  };

};
