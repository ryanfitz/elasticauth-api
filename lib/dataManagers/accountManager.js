'use strict';

var Account    = require('../models/account'),
    Boom       = require('boom'),
    uuid       = require('uuid'),
    async      = require('async'),
    _          = require('lodash');

var internals = {};

internals.createAccount = function (accountId, data, callback) {
  callback = callback || _.noop;

  var params = {};
  params.ConditionExpression = '#i <> :accid';
  params.ExpressionAttributeNames = {'#i' : 'id'};
  params.ExpressionAttributeValues = {':accid' : accountId};

  var acc = _.merge({}, data, {id : accountId});

  var wrapErrorFun = function (err, account) {
    if(err && err.code === 'ConditionalCheckFailedException') {
      return callback(Boom.badRequest('Account with id ' + accountId + ' already exists'));
    } else if (err) {
      return callback(err);
    } else {
      return callback(null, account);
    }
  };

  Account.create(acc, params, wrapErrorFun);
};

internals.removeAccount = function (accountId, callback) {
  callback = callback || _.noop;

  var opts = { ReturnValues : 'ALL_OLD'};
  Account.destroy(accountId, opts, callback);
};

internals.create = function (credManager, log, data, callback) {
  var accountId = data.id || uuid.v4();

  async.series({
    creds : async.apply(credManager.create, accountId, data),
    account : async.apply(internals.createAccount, accountId, data),
  }, function (err, results) {
    if(err) {
      log.info({err : err, data : data}, 'failed to create account');
      credManager.remove(accountId, data);

      return callback(err);
    } else {
      var acc = results.account.get();
      return callback(null, acc);
    }
  });
};

internals.remove = function (credManager, log, accountId, callback) {
  async.waterfall([
    async.apply(internals.removeAccount, accountId),
    function (account, callback) {
      if(account) {
        return credManager.remove(accountId, account.get(), callback);
      } else {
        return callback();
      }
    }
  ], function (err) {
    if(err) {
      log.info({err : err}, 'failed to remove account');
      //credManager.remove(accountId, data);

      return callback(err);
    } else {
      return callback();
    }
  });
};

internals.accountProjections = function (allFields) {
  if(allFields) {
    return {};
  } else {
    return {
      ProjectionExpression : '#i, #u, #n, #m',
      ExpressionAttributeNames : {
        '#i' : 'id',
        '#u' : 'username',
        '#n' : 'name',
        '#m' : 'metadata'
      }
    };
  }
};

internals.findAccountById = function(id, options, callback) {
  return internals.findAccountsByIds([id], options, callback);
};

internals.findAccountsByIds = function(ids, options, callback) {
  Account.getItems(ids, options, function (err, accounts) {
    if(err) {
      return callback(err);
    } else if (_.isNull(accounts)) {
      return callback(null, []);
    } else {
      return callback(null, _.invoke(accounts, 'get'));
    }
  });
};

internals.findAccountByQuery = function(key, options, callback) {
  var opts = _.defaults({}, options, {limit : 1, index : 'emailIndex'});

  var query = Account.query(key).usingIndex(options.index).limit(opts.limit);

  if(options.ProjectionExpression) {
    query.projectionExpression(options.ProjectionExpression);
  }

  if(options.ExpressionAttributeNames) {
    query.expressionAttributeNames(options.ExpressionAttributeNames);
  }

  query.exec(function (err, data) {
    if(err) {
      return callback(err);
    } else if (_.isEmpty(data.Items)) {
      return callback(null, []);
    } else {
      return callback(null, _.invoke(data.Items, 'get'));
    }
  });
};

internals.find = function (log, params, options, callback) {
  if (typeof options === 'function' && !callback) {
    callback = options;
    options = {};
  }

  callback = callback || _.noop;
  options = _.defaults({}, options, {allFields : false});

  var opts = _.merge({}, internals.accountProjections(options.allFields));

  if(params.id) {
    return internals.findAccountById(params.id, opts, callback);
  } else if(params.ids) {
    return internals.findAccountsByIds(params.ids, opts, callback);
  } else if (params.email) {
    opts.index = 'emailIndex';
    return internals.findAccountByQuery(params.email, opts, callback);
  } else if (params.username) {
    opts.index = 'usernameIndex';
    return internals.findAccountByQuery(params.username, opts, callback);
  } else if (params.facebookId) {
    opts.index = 'facebookIndex';
    return internals.findAccountByQuery(params.facebookId, opts, callback);
  } else {
    return callback(null, []);
  }
};

module.exports = function (credentialManger, logger) {
  return {
    create : _.partial(internals.create, credentialManger, logger),
    remove : _.partial(internals.remove, credentialManger, logger),
    find : _.partial(internals.find, logger)
  };
};
