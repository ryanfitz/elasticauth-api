'use strict';

var Account    = require('../models/account'),
    //Boom       = require('boom'),
    uuid       = require('uuid'),
    async      = require('async'),
    _          = require('lodash');

var internals = {};

internals.createAccount = function (accountId, data, callback) {
  callback = callback || _.noop;

  var params = {};
  params.ConditionExpression = '#i <> :accid';
  params.ExpressionAttributeNames = {'#i' : 'id'};
  params.ExpressionAttributeValues = {':accid' : accountId};

  var acc = _.merge({}, data, {id : accountId});
  Account.create(acc, params, callback);
};

internals.removeAccount = function (accountId, callback) {
  callback = callback || _.noop;

  var opts = { ReturnValues : 'ALL_OLD'};
  Account.destroy(accountId, opts, callback);
};

internals.create = function (credManager, log, data, callback) {
  var accountId = uuid.v4();

  async.series({
    creds : async.apply(credManager.create, accountId, data),
    account : async.apply(internals.createAccount, accountId, data),
  }, function (err, results) {
    if(err) {
      log.info({err : err, data : data}, 'failed to create account');
      credManager.remove(accountId, data);

      return callback(err);
    } else {
      var acc = results.account.get();
      return callback(null, acc);
    }
  });
};

internals.remove = function (credManager, log, accountId, callback) {
  async.waterfall([
    async.apply(internals.removeAccount, accountId),
    function (account, callback) {
      if(account) {
        return credManager.remove(accountId, account.get(), callback);
      } else {
        return callback();
      }
    }
  ], function (err) {
    if(err) {
      log.info({err : err}, 'failed to remove account');
      //credManager.remove(accountId, data);

      return callback(err);
    } else {
      return callback();
    }
  });
};

module.exports = function (credentialManger, logger) {
  return {
    create : _.partial(internals.create, credentialManger, logger),
    remove : _.partial(internals.remove, credentialManger, logger)
  };
};
