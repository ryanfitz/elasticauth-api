'use strict';

var bunyan         = require('bunyan'),
    authentication = require('./auth'),
    accountController = require('./controllers/accountController'),
    tokenController  = require('./controllers/tokenController'),
    credentialManger = require('./dataManagers/credentialManager'),
    accountManger   = require('./dataManagers/accountManager'),
    facebook        = require('./providers/facebook'),
    jsonResponses   = require('./responses'),
    tokenModel      = require('./models/token'),
    cognito         = require('./dataManagers/cognito'),
    routes          = require('./routes');

var internals = {};

internals.createLogger = function (settings) {
  if(settings.log) {
    return  settings.log.child({
      component: 'elasticauth-api',
      serializers: bunyan.serializers
    });
  } else {
    return bunyan.createLogger({
      name: 'elasticauth-api',
      stream: process.stderr,
      level: process.env.ELASTICAUTH_LOG_LEVEL || 'fatal',
      serializers: bunyan.serializers
    });
  }
};

module.exports = function(options) {
  options = options || {};

  var log = internals.createLogger(options);
  var auth = authentication(options.key);
  var cognitoClient = cognito(options.cognito, log);
  var token = tokenModel(options.key, cognitoClient);

  var credManager = credentialManger(log);
  var accManager = accountManger(credManager, log);

  var facebookSettings = {
    appSecret : options.facebookAppSecret,
    logger : log,
  };

  var facebookClient = facebook(facebookSettings);

  var responses = jsonResponses(options.uri, {accountLinks : options.accountLinks});
  var accountCtrl = accountController(accManager, token, responses, log);
  var tokenCtrl = tokenController(accManager, token, facebookClient, responses, log);

  var endpoints = routes(accountCtrl, tokenCtrl);

  return {
    log : log,
    auth : auth,
    endpoints : endpoints
  };
};
