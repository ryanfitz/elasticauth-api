'use strict';

var Joi   = require('joi'),
    async = require('async'),
    _     = require('lodash');

var internals = {};

internals.create = {
  validate: {
    payload : {
      email    : Joi.string().email().required(),
      username : Joi.string().min(3).max(60).required(),
      name     : Joi.string().trim().lowercase(),
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
      id: 'rootAccounts'
    }
  };

  return result;
};
