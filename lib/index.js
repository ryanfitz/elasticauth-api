'use strict';

var bunyan = require('bunyan');

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

exports.register = function (server, options, next) {
  var log = internals.createLogger(options);

  server.route({
    method: 'GET',
    path: '/',
    config: {
      handler: function (request, reply) {
        return reply('OK');
      },
      id: 'root'
    }
  });

  log.info('elastic auth api registered');

  next();
};

exports.register.attributes = {
  pkg: require('../package.json')
};
