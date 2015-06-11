'use strict';

var jwt  = require('jsonwebtoken'),
    _    = require('lodash'),
    AWS  = require('aws-sdk');

var internals = {
  cognitoIdentity : new AWS.CognitoIdentity({apiVersion: '2014-06-30'})
};

internals.create = function (key, cognito, account, callback) {
  var claims = {
    user  : account.id,
    name  : account.name,
    scope : _.union(account.roles, ['accesstoken'])
  };

  var accessToken = jwt.sign(claims, key, { expiresInMinutes: 60 });

  internals.verify(key, accessToken, function (err, decoded) {
    var refreshClaims = {
      user: account.id,
      scope : ['refreshtoken']
    };

    var refreshToken = jwt.sign(refreshClaims, key);

    var result = {
      accountID : account.id,
      accessToken : accessToken,
      type : 'Bearer',
      expires: decoded.exp * 1000,
      refreshToken : refreshToken
    };

    cognito.createToken(account, function (err, data) {
      if (err) {
        return callback(null, result);
      } else {
        return callback(null, _.merge({}, result, data));
      }
    });

  });
};

internals.verify = function (key, token, callback) {
  return jwt.verify(token, key, callback);
};

module.exports = function (privateKey, cognito) {

  return {
    create : _.partial(internals.create, privateKey, cognito),
    verify : _.partial(internals.verify, privateKey),
  };

};
