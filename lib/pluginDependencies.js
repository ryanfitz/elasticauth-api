'use strict';

var bunyan         = require('bunyan'),
    authentication = require('./auth'),
    accountsCtrl   = require('./controllers/accountController'),
    credentialManger = require('./dataManagers/credentialManager'),
    accountManger   = require('./dataManagers/accountManager'),
    jsonResponses   = require('./responses'),
    tokenModel      = require('./models/token'),
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
  var token = tokenModel(options.key);

  var credManager = credentialManger(log);
  var accManager = accountManger(credManager, log);

  var responses = jsonResponses(options.uri);
  var accountsController = accountsCtrl(accManager, token, responses, log);
  var endpoints = routes(accountsController);

  return {
    log : log,
    auth : auth,
    endpoints : endpoints
  };
};
