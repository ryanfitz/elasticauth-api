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

      var query = request.query || {};
      var payload = request.payload || {};

      if(query.include === 'account' || payload.include === 'account') {
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

internals.createTokenForEmail = function(accountManager, token, mailer, emailOrUsername, urlType, request, reply) {
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
      mailer.sendLoginEmail(account, auth, urlType, callback);
    }
  ], function (err) {
    if (err) {
      return reply(err);
    }

    return reply({message : 'OK'}).code(201);
  });
};

internals.createTokenForAccountByAdmin = function (accountManager, createTokenForAccount, accountId, request, reply) {
  return accountManager.find({id: accountId}, {allFields: true}, function (err, accounts) {
    if (err) {
      return reply(err);
    }

    if (_.isEmpty(accounts)) {
      return reply(Boom.notFound('Account not found'));
    }

    return createTokenForAccount(_.first(accounts), request, reply);
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
    payload : Joi.object({
      facebookAccessToken : Joi.string(),
      email : Joi.string(),
      accountId : Joi.string(),
      include: Joi.string(),
      urlType: Joi.string().default('default')
    }).allow(null)
  },

  handler: function (createTokenForAccount, createTokenForFacebook, createTokenForEmail, createTokenForAccountByAdmin, responses, log, request, reply) {
    if (request.auth.isAuthenticated) {
      if (_.has(request.payload, 'accountId')) {
        if (_.includes(request.auth.credentials.roles, 'admin') ||
              request.payload.accountId === request.auth.credentials.id) {
          return createTokenForAccountByAdmin(request.payload.accountId, request, reply);
        } else {
          return reply(Boom.forbidden('Access Denied'));
        }
      }

      var account = request.auth.credentials;
      return createTokenForAccount(account, request, reply);
    } else if (_.has(request.payload, 'facebookAccessToken')) {
      return createTokenForFacebook(request.payload.facebookAccessToken, request, reply);
    } else if (_.has(request.payload, 'email')) {
      return createTokenForEmail(request.payload.email, request.payload.urlType, request, reply);
    } else {
      return reply(Boom.unauthorized('missing credentials'));
    }
  }
};

module.exports = function (accountManager, token, facebookClient, mailer, responses, logger) {
  var createTokenForAccount = _.partial(internals.createTokenForAccount, token, responses);
  var createTokenForFacebook = _.partial(internals.createTokenForFacebook, facebookClient, accountManager, createTokenForAccount, responses);
  var createTokenForEmail = _.partial(internals.createTokenForEmail, accountManager, token, mailer);
  var createTokenForAccountByAdmin = _.partial(internals.createTokenForAccountByAdmin, accountManager, createTokenForAccount);

  var result = {
    verify : {
      handler  : _.partial(internals.verify.handler, token, responses, logger),
      auth :  { mode : 'required', strategy : 'token', scope : ['accesstoken', 'refreshtoken']},
      description: 'Verify access tokens',
      tags: ['api'],
      id: 'verifyToken'
    },
    create : {
      handler  : _.partial(internals.create.handler, createTokenForAccount, createTokenForFacebook, createTokenForEmail, createTokenForAccountByAdmin, responses, logger),
      validate : internals.create.validate,
      auth :  { mode : 'optional', strategy : 'token', scope : ['accesstoken', 'refreshtoken']},
      description: 'create new auth tokens from an existing valid access token',
      tags: ['api'],
      id: 'createToken'
    }
  };

  return result;
};
