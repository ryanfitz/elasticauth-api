'use strict';

//var Wreck  = require('wreck'),
var Crypto = require('crypto'),
    Boom   = require('boom'),
    request = require('request'),
//async      = require('async'),
    _          = require('lodash');

var internals = {};

internals.fetchProfile = function (settings, accesstoken, callback) {
  if(!settings.appSecret) {
    var err = Boom.notImplemented('Facebook app secret not configured');
    return callback(err);
  }

  var query = {
    /*jshint camelcase: false */
    appsecret_proof: Crypto.createHmac('sha256', settings.appSecret).update(accesstoken).digest('hex'),
    access_token : accesstoken
  };

  var profileUrl = settings.profileUrl || 'https://graph.facebook.com/v2.3/me';

  request.get({ url: profileUrl, json : true, qs : query }, function (err, res, data) {
    if(err) {
      return callback(err);
    } else if (res.statusCode >= 400) {
      return callback(Boom.unauthorized('invalid facebook access token'));
    }

    var profile = {
      id: data.id,
      username: data.username,
      displayName: data.name,
      name: {
        first: data.first_name,
        last: data.last_name,
        middle: data.middle_name
      },
      email: data.email,
      raw: data
    };

    return callback(null, profile);
  });
};

module.exports = function (settings) {
  return {
    fetchProfile : _.partial(internals.fetchProfile, settings),
  };
};
