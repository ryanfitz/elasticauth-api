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

internals.tokenValidate = function (request, token, callback) {
  return Account.get(token.user, internals.loadAccountData(token, callback));
};

module.exports = function (privateKey) {

  return {
    tokenValidate : _.partial(internals.tokenValidate),
    key : privateKey
  };

};
