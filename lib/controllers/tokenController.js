'use strict';

//async = require('async'),

var Joi = require('joi'),
    Boom = require('boom'),
    async = require('async'),
    _   = require('lodash');

var internals = {};

internals.createTokenForAccount = function(token, responses, account, request, reply) {
  token.create(account, function (err, auth) {
    if(err) {
      return reply(err);
    } else {
      var opts;

      if(request.query.include === 'account') {
        opts = {linked : { accounts : account }};
      }

      var resp = responses.tokensResponse(auth, opts, request.url);
      var location = _.first(resp.tokens).href;
      return reply(resp).created(location);
    }
  });
};

internals.createTokenForFacebook = function(facebookClient, accountManager, createTokenForAccount, responses, accesstoken, request, reply) {
  var profileData;

  async.waterfall([
    function(callback) {
      facebookClient.fetchProfile(accesstoken, callback);
    },
    function(profile, callback) {
      profileData = profile;
      accountManager.find({facebookId : profile.id}, {allFields : true}, callback);
    },
    function(accounts, callback) {
      var acc = _.first(accounts);

      if (acc) {
        return callback(null, acc);
      } else {
        var name = profileData.displayName;
        var username = profileData.username || _.camelCase(name) + _.random(999);
        var data = {email : profileData.email, name : name, username : username, facebookId : profileData.id };
        return accountManager.create(data, callback);
      }
    }
  ], function (err, account) {
    if (err) {
      return reply(err);
    }

    return createTokenForAccount(account, request, reply);
  });
};

internals.verify = {

  handler: function (token, responses, log, request, reply) {
    reply('OK');
  }
};

internals.create = {
  validate: {
    query : {
      include: Joi.string()
    },
    payload : {
      facebookAccessToken : Joi.string()
    }
  },

  handler: function (createTokenForAccount, createTokenForFacebook, responses, log, request, reply) {
    if(request.auth.isAuthenticated) {
      var account = request.auth.credentials;
      return createTokenForAccount(account, request, reply);
    } else if (_.has(request.payload, 'facebookAccessToken')) {
      return createTokenForFacebook(request.payload.facebookAccessToken, request, reply);
    } else {
      return reply(Boom.unauthorized('missing credentials'));
    }
  }
};

module.exports = function (accountManager, token, facebookClient, responses, logger) {
  var createTokenForAccount = _.partial(internals.createTokenForAccount, token, responses);
  var createTokenForFacebook = _.partial(internals.createTokenForFacebook, facebookClient, accountManager, createTokenForAccount, responses);

  var result = {
    verify : {
      handler  : _.partial(internals.verify.handler, token, responses, logger),
      auth :  { mode : 'required', strategy : 'token', scope : ['accesstoken', 'refreshtoken']},
      description: 'Verify access tokens',
      tags: ['api'],
      id: 'verifyToken'
    },
    create : {
      handler  : _.partial(internals.create.handler, createTokenForAccount, createTokenForFacebook, responses, logger),
      validate : internals.create.validate,
      auth :  { mode : 'optional', strategy : 'token', scope : ['accesstoken', 'refreshtoken']},
      description: 'create new auth tokens from an existing valid access token',
      tags: ['api'],
      id: 'createToken'
    }
  };

  return result;
};
