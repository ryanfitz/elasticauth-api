'use strict';

var vogels    = require('vogels'),
    AWS       = vogels.AWS,
    bunyan    = require('bunyan'),
    Hapi      = require('hapi'),
    _         = require('lodash'),
    cryptiles = require('cryptiles');

//var internals = {};

exports.localDynamoDB = function () {
  var opts = { endpoint : 'http://dynamodb-local:8000', apiVersion: '2012-08-10' };
  return new AWS.DynamoDB(opts);
};

exports.testLogger = function () {
  return bunyan.createLogger({name: 'tests', level : 'fatal'});
};

exports.randomEmail = function () {
  return cryptiles.randomString(10) + '@test.com';
};

exports.randomUsername = function () {
  return cryptiles.randomString(12);
};

exports.randomFacebookAccessToken = function () {
  return cryptiles.randomString(256);
};

exports.randomFacebookId = function () {
  return String(_.random(1000000000000000, 9999999999999999));
};

exports.testMailerSettings = function () {
  return {
    fromAddress : 'test@test.com',
    subject : 'Test app Login',
    loginUrl : 'http://127.0.0.1/login?token=${auth.accessToken}',
    transport : 'stub'
  };
};

exports.authHeader = function (token, type) {
  var t = token.access;
  if(type === 'refresh') {
    t = token.refresh;
  }

  return {authorization : 'Bearer ' + t};
};

exports.testApiServer = function (callback) {
  var driver = exports.localDynamoDB();
  vogels.dynamoDriver(driver);

  var plugin = require('../');
  var server = new Hapi.Server();
  server.connection();

  var options = {
    log : exports.testLogger(),
    key : 'BbZijuoXAdr85UzyijKARZimKfrSmQ6fv8kZ7OFfc',
    mailer : {
      fromAddress : 'test@test.com',
      subject : 'Test app Login',
      loginUrl : 'http://127.0.0.1/login?token=${auth.accessToken}',
      transport : 'stub'
    }
  };

  server.method('createAccount', function (next) {
    var data = {
      email : exports.randomEmail(),
      username : exports.randomUsername(),
      name : exports.randomUsername()
    };

    var request = { method: 'POST', url: '/accounts', payload : data};

    server.inject(request, function (res) {
      var result = {
        account : _.first(res.result.accounts),
        token  : _.first(res.result.linked.tokens)
      };

      return next(null, result);
    });
  });

  server.register( {
    register : plugin,
    options : options
  }, callback);

  return server;
};

exports.mockCognitoClient = function () {
  return {
    createToken : function (account, callback) {
      return callback(null, {
        cognitoId : 'us-east-1:5c2c6676-ce64-477d-a949-b3644ab472f3',
        cognitoToken : 'eyJraWQiOiJ1cy1lYXN0LTExIiwidHlwIjoiSldTIiwiYWxnIjoiUlM1MTIifQ'
      });
    },
  };
};
