'use strict';

var Hapi       = require('hapi'),
    elasticApi = require('../index'),
    server     = new Hapi.Server(),
    vogels     = require('vogels'),
    AWS        = vogels.AWS,
    bunyan     = require('bunyan');

var opts = { endpoint : process.env.DYNAMODB_ENDPOINT, apiVersion: '2012-08-10' };
var dynamodb = new AWS.DynamoDB(opts);
vogels.dynamoDriver(dynamodb);

var log = bunyan.createLogger({
  name: 'example-server',
  serializers: bunyan.stdSerializers
});

server.connection({ port: 8080, host : 'localhost', address: '0.0.0.0' });

server.register( {
  register : elasticApi,
  options : {
    key : 'BbZijuoXAdr85UzyijKARZimKfrSmQ6fv8kZ7OFfc',
    facebookAppSecret : process.env.FACEBOOK_APP_SECRET,
    log : log,
    cognito : {
      identityPoolId : process.env.COGNITO_IDENTITY_POOL_ID,
      developerProviderName : process.env.COGNITO_DEVELOPER_PROVIDER_NAME
    },
    mailer : {
      fromAddress : 'login@example.com',
      subject : 'Example app Login',
      loginUrls : {
        default: 'http://127.0.0.1/login?token=${auth.accessToken}'
      },
      transport : 'stub'
    }
  }
}, function (err) {
  if(err) {
    log.error({err : err}, 'Failed to load plugins');
  }
});

server.start(function (err) {
  if(err) {
    log.error({err : err}, 'Failed to start server');
  } else {
    log.info('Server started at: ' + server.info.uri);
  }
});
