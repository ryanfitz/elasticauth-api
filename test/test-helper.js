'use strict';

var vogels    = require('vogels'),
    AWS       = vogels.AWS,
    bunyan    = require('bunyan'),
    cryptiles = require('cryptiles');

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

exports.authHeader = function (token) {
  return {authorization : 'Bearer ' + token.access};
};
