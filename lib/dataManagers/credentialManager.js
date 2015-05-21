'use strict';

var Credential = require('../models/credential'),
    Boom       = require('boom'),
    async      = require('async'),
    _          = require('lodash');

var internals = {};

internals.createCredential = function (type, authId, accountId, callback) {
  if(authId) {
    var key = type + ':' + authId;

    var params = {};
    params.ConditionExpression = '#i <> :k';
    params.ExpressionAttributeNames = {'#i' : 'id'};
    params.ExpressionAttributeValues = {':k' : key};

    return Credential.create({id: key, accountId : accountId}, params, function (err) {
      if(err && err.code === 'ConditionalCheckFailedException') {
        return callback(Boom.badRequest(type + ' already exists'));
      } else if (err) {
        return callback(err);
      } else {
        return callback();
      }
    });
  } else {
    return callback(Boom.badRequest(type + ' is required'));
  }
};

internals.removeCredential = function (type, authId, accountId, callback) {
  callback = callback || _.noop;

  if(authId) {
    var key = type + ':' + authId;

    var params = {};
    params.ConditionExpression = '#a = :accid';
    params.ExpressionAttributeNames = {'#a' : 'accountId'};
    params.ExpressionAttributeValues = {':accid' : accountId};

    return Credential.destroy(key, params, callback);
  } else {
    return callback(Boom.badRequest(type + ' is required'));
  }
};

internals.createCredentials = function (log, accountId, data, callback) {
  callback = callback || _.noop;

  var funcs = [
    async.apply(internals.createCredential, 'email', data.email, accountId),
    async.apply(internals.createCredential, 'username', data.username, accountId)
  ];

  if (data.facebookId) {
    var fun = async.apply(internals.createCredential, 'facebook', data.facebookId, accountId);
    funcs.push(fun);
  }

  async.parallel(funcs, callback);
};

internals.removeCredentials = function (log, accountId, data, callback) {
  callback = callback || _.noop;

  var funcs =[
    async.apply(internals.removeCredential, 'email', data.email, accountId),
    async.apply(internals.removeCredential, 'username', data.username, accountId)
  ];

  if (data.facebookId) {
    var fun = async.apply(internals.removeCredential, 'facebook', data.facebookId, accountId);
    funcs.push(fun);
  }

  async.parallel(funcs, callback);
};

module.exports = function (logger) {
  return {
    create : _.partial(internals.createCredentials, logger),
    remove : _.partial(internals.removeCredentials, logger)
  };
};
