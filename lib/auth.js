'use strict';

var _      = require('lodash'),
   Account = require('./models/account');

var internals = {};

internals.loadAccountData = function (token, callback) {

  return function (err, account) {
    if (err) {
      return callback(err);
    }

    if(!account) {
      return callback(null, false);
    }

    var credentials = account.get();
    if(token) {
      credentials.scope = token.scope;
    }

    return callback(null, true, credentials);
  };
};

internals.basicAuthValidate = function (username, password, callback) {
  return Account.verify(username, password, function (err, accountId) {
    if(err && err.code === 'AuthFailed') {
      return callback(null, false);
    } else if (err) {
      return callback(err);
    }

    return Account.get(accountId, internals.loadAccountData(null, callback));
  });
};

internals.tokenValidate = function (token, callback) {
  return Account.get(token.user, internals.loadAccountData(token, callback));
};

module.exports = function (privateKey) {

  return {
    basicAuthValidate : _.partial(internals.basicAuthValidate),
    tokenValidate : _.partial(internals.tokenValidate),
    key : privateKey
  };

};
