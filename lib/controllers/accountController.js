'use strict';

var Joi   = require('joi'),
    async = require('async'),
    Boom  = require('boom'),
    _     = require('lodash');

var internals = {};

internals.canModifyAccount = function (auth, accountId) {
  if(auth.isAuthenticated && auth.credentials.id === accountId) {
    return true;
  } else {
    return false;
  }
};

internals.search = {
  validate: {
    query : Joi.object().keys({
      ids : Joi.string(),
      email : Joi.string(),
      username : Joi.string()
    }).xor('email', 'username', 'ids')
  },

  handler: function (accountManager, responses, log, request, reply) {
    var params = request.query;

    if(_.has(params, 'ids')) {
      params.ids = params.ids.split(',');
    }

    log.info({params : params}, 'attempting to find account');

    accountManager.find(params, function (err, accounts) {
      if(err) {
        reply(err);
      } else if (_.isEmpty(accounts)) {
        reply(Boom.notFound('no accounts matching criteria found'));
      } else {
        var resp = responses.accountsResponse(accounts, null, request.url);
        return reply(resp);
      }
    });
  }
};


internals.get = {
  validate: {
    params : {
      accountId : Joi.string().required(),
    }
  },

  handler: function (accountManager, responses, log, request, reply) {
    var id = request.params.accountId;

    log.info({id : id}, 'attempting to get account');

    var opts = {allFields : internals.canModifyAccount(request.auth, id)};

    accountManager.find({id : id}, opts, function (err, accounts) {
      if(err) {
        reply(err);
      } else if (_.isEmpty(accounts)) {
        reply(Boom.notFound('account not found'));
      } else {
        var resp = responses.accountsResponse(accounts, null, request.url);
        return reply(resp);
      }
    });
  }
};

internals.create = {
  validate: {
    payload : {
      id       : Joi.string().guid().optional(),
      email    : Joi.string().email().required(),
      username : Joi.string().min(3).max(60).required(),
      name     : Joi.string().trim().lowercase(),
      metadata : Joi.object()
    }
  },

  handler: function (accountManager, token, responses, log, request, reply) {
    log.info('attempting to create account');

    var account;

    async.waterfall([
      async.apply(accountManager.create, request.payload),
      function (acc, callback) {
        account = acc;
        return token.create(account, callback);
      },
      function (tokenData, callback) {
        var opts = {
          linked : {tokens : tokenData}
        };

        var resp = responses.accountsResponse(account, opts, request.url);
        return callback(null, resp);
      }
    ], function (err, resp) {
      if(err) {
        reply(err);
      } else {
        var location = _.first(resp.accounts).href;
        return reply(resp).created(location);
      }
    });
  }
};

module.exports = function (accountManager, token, responses, logger) {
  var result = {
    create : {
      handler  : _.partial(internals.create.handler, accountManager, token, responses, logger),
      validate : internals.create.validate,
      description: 'Create a new account',
      tags: ['api'],
      id: 'rootAccounts'
    },
    get : {
      handler  : _.partial(internals.get.handler, accountManager, responses, logger),
      validate : internals.get.validate,
      auth :  { mode : 'optional', strategy : 'token', scope : ['accesstoken']},
      description: 'Get an account by id',
      tags: ['api'],
      id: 'getAccount'
    },
    search : {
      handler  : _.partial(internals.search.handler, accountManager, responses, logger),
      validate : internals.search.validate,
      description: 'search for account by either email or username',
      tags: ['api'],
      id: 'searchAccounts'
    }
  };

  return result;
};
