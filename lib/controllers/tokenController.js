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

      if(request.query.include === 'account' || request.payload.include === 'account') {
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
      if (_.isEmpty(accounts)) {
        accountManager.find({email : profileData.email}, {allFields : true}, callback);
      } else {
        return callback(null, accounts);
      }
    },
    function(accounts, callback) {
      var acc = _.first(accounts);

      if (acc) {
        // attempt to link account with facebook id if not already exists
        if(!acc.facebookId) {
          acc.facebookId = profileData.id;
          accountManager.linkAccountWithProvider(acc.id, 'facebook', profileData.id);
        }

        return callback(null, acc);
      } else {
        var name = profileData.displayName;
        var username = profileData.username || _.camelCase(name) + _.random(999);
        var metadata = {
          smallPictureUrl : 'http://graph.facebook.com/v2.3/' + profileData.id + '/picture?type=normal',
          mediumPictureUrl : 'http://graph.facebook.com/v2.3/' + profileData.id + '/picture?type=large',
        };

        var data = {
          email : profileData.email,
          name : name,
          username : username,
          facebookId : profileData.id,
          metadata : metadata
        };

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

internals.createTokenForEmail = function(accountManager, token, mailer, emailOrUsername, request, reply) {
  var account;

  async.waterfall([
    function(callback) {
      accountManager.find({email : emailOrUsername}, {allFields : true}, callback);
    },
    function(accounts, callback) {
      if (_.isEmpty(accounts)) {
        accountManager.find({username : emailOrUsername}, {allFields : true}, callback);
      } else {
        return callback(null, accounts);
      }
    },
    function(accounts, callback) {
      if (_.isEmpty(accounts)) {
        return callback(Boom.notFound('Account not found'));
      }

      account = _.first(accounts);
      token.create(account, callback);
    },
    function(auth, callback) {
      mailer.sendLoginEmail(account, auth, callback);
    }
  ], function (err) {
    if (err) {
      return reply(err);
    }

    return reply({message : 'OK'}).code(201);
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
      facebookAccessToken : Joi.string(),
      email : Joi.string(),
      include: Joi.string()
    }
  },

  handler: function (createTokenForAccount, createTokenForFacebook, createTokenForEmail, responses, log, request, reply) {
    if(request.auth.isAuthenticated) {
      var account = request.auth.credentials;
      return createTokenForAccount(account, request, reply);
    } else if (_.has(request.payload, 'facebookAccessToken')) {
      return createTokenForFacebook(request.payload.facebookAccessToken, request, reply);
    } else if (_.has(request.payload, 'email')) {
      return createTokenForEmail(request.payload.email, request, reply);
    } else {
      return reply(Boom.unauthorized('missing credentials'));
    }
  }
};

module.exports = function (accountManager, token, facebookClient, mailer, responses, logger) {
  var createTokenForAccount = _.partial(internals.createTokenForAccount, token, responses);
  var createTokenForFacebook = _.partial(internals.createTokenForFacebook, facebookClient, accountManager, createTokenForAccount, responses);
  var createTokenForEmail = _.partial(internals.createTokenForEmail, accountManager, token, mailer);

  var result = {
    verify : {
      handler  : _.partial(internals.verify.handler, token, responses, logger),
      auth :  { mode : 'required', strategy : 'token', scope : ['accesstoken', 'refreshtoken']},
      description: 'Verify access tokens',
      tags: ['api'],
      id: 'verifyToken'
    },
    create : {
      handler  : _.partial(internals.create.handler, createTokenForAccount, createTokenForFacebook, createTokenForEmail, responses, logger),
      validate : internals.create.validate,
      auth :  { mode : 'optional', strategy : 'token', scope : ['accesstoken', 'refreshtoken']},
      description: 'create new auth tokens from an existing valid access token',
      tags: ['api'],
      id: 'createToken'
    }
  };

  return result;
};
