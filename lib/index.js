'use strict';

var dependencies = require('./pluginDependencies'),
    vogels       = require('vogels');

//var internals = {};

exports.register = function (server, options, next) {
  options.uri = options.uri || server.info.uri;
  var deps = dependencies(options);

  var log = deps.log;

  server.register(require('hapi-auth-jwt'), function (err) {
    if(err) {
      log.error({err : err}, 'Failed to load hapi-auth-jwt plugin');
      return next(err);
    }

    var auth = deps.auth;

    vogels.createTables(function (err) {
      if(err) {
        log.error({err : err}, 'Failed to create Elastic Auth tables');
        return next(err);
      } else {
        server.auth.strategy('token', 'jwt', { key: auth.key,  validateFunc: auth.tokenValidate });
        server.route(deps.endpoints);

        log.info('elastic auth api registered');
        return next();
      }
    });

  });

};

exports.register.attributes = {
  pkg: require('../package.json')
};
