'use strict';

//async = require('async'),
//Boom  = require('boom'),

var Joi = require('joi'),
    _   = require('lodash');

var internals = {};

internals.verify = {

  handler: function (token, responses, log, request, reply) {
    reply('OK');
  }
};

internals.create = {
  validate: {
    query : {
      include: Joi.string()
    }
  },

  handler: function (accountManager, token, responses, log, request, reply) {
    var account = request.auth.credentials;

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
  }
};

module.exports = function (accountManager, token, responses, logger) {
  var result = {
    verify : {
      handler  : _.partial(internals.verify.handler, token, responses, logger),
      auth :  { mode : 'required', strategy : 'token', scope : ['accesstoken', 'refreshtoken']},
      description: 'Verify access tokens',
      tags: ['api'],
      id: 'verifyToken'
    },
    create : {
      handler  : _.partial(internals.create.handler, accountManager, token, responses, logger),
      validate : internals.create.validate,
      auth :  { mode : 'required', strategy : 'token', scope : ['accesstoken', 'refreshtoken']},
      description: 'create new auth tokens from an existing valid access token',
      tags: ['api'],
      id: 'createToken'
    }
  };

  return result;
};
