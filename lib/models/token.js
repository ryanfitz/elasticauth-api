'use strict';

var jwt  = require('jsonwebtoken'),
    _    = require('lodash');

var internals = {};

internals.create = function (key, account, callback) {
  var claims = {
    user  : account.id,
    name  : account.name,
    scope : account.roles
  };

  var accessToken = jwt.sign(claims, key, { expiresInMinutes: 60 });

  internals.verify(key, accessToken, function (err, decoded) {
    var refreshClaims = {
      user: account.id,
      scope : ['refreshtoken']
    };

    var refreshToken = jwt.sign(refreshClaims, key);

    var result = {
      accessToken : accessToken,
      type : 'Bearer',
      expires: decoded.exp * 1000,
      refreshToken : refreshToken
    };

    return callback(null, result);
  });
};

internals.verify = function (key, token, callback) {
  return jwt.verify(token, key, callback);
};

module.exports = function (privateKey) {

  return {
    create : _.partial(internals.create, privateKey),
    verify : _.partial(internals.verify, privateKey),
  };

};
