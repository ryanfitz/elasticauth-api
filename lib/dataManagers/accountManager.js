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
    } else if (_.isNull(accounts) || _.isEmpty(accounts)) {
      return callback(null, []);
    } else {
      // maintain original order of ids
      var data = _.invoke(accounts, 'get');
      var idIndex = _.indexBy(data, 'id');

      var result = _.chain(ids).map(function (id) {
        return idIndex[id];
      }).compact().value();

      return callback(null, result);
    }
  });
};

internals.findAccountByQuery = function(key, options, callback) {
  var opts = _.defaults({}, options, {limit : 1, index : 'emailIndex'});

  var query = Account.query(key.toLowerCase()).usingIndex(options.index).limit(opts.limit);

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

internals.updateAccount = function(updateAccountCredentialFunc, updateAccountFunc, data, callback) {
  var updateCredentialFuncs = [];

  _.forEach(['email', 'username', 'facebookId'], function(key) {
    if(_.has(data, key)) {
      updateCredentialFuncs.push(function(callback) {
        updateAccountCredentialFunc(data.id, key, data[key], callback);
      });
    }
  });

  async.parallel(updateCredentialFuncs, function(err) {
    if(err) {
      return callback(err);
    } else {
      var updateData = _.omit(data, 'email', 'username', 'facebookId');
      return updateAccountFunc(updateData, callback);
    }
  });
};

internals.update = function (log, data, options, callback) {
  if (typeof options === 'function' && !callback) {
    callback = options;
    options = {};
  }

  var params = _.merge({}, options);
  params.ConditionExpression = '#i = :x';
  params.ExpressionAttributeNames = {'#i' : 'id'};
  params.ExpressionAttributeValues = {':x' : data.id};

  if(data.metadata) {
    params.ExpressionAttributeNames['#meta'] = 'metadata';

    var exp = _.map(data.metadata, function (val, key) {
      var attrValKey = ':meta_' + key;

      if(_.isString(val) && _.isEmpty(val)) {
        params.ExpressionAttributeValues[attrValKey] = null;
      } else {
        params.ExpressionAttributeValues[attrValKey] = val;
      }


      return '#meta.' + key + ' = ' + attrValKey;
    }).join(', ');

    params.UpdateExpression = 'SET ' + exp;

    data = _.omit(data, 'metadata');
  }

  var wrapErrorFun = function (err, account) {
    if(err && err.code === 'ConditionalCheckFailedException') {
      return callback(Boom.notFound('Account with id ' + data.id + ' not found'));
    } else if (err) {
      log.info({err : err, data : data}, 'Failed to update account');
      return callback(err);
    } else if (account) {
      return callback(null, account.get());
    } else {
      return callback();
    }
  };

   return Account.update(data, params, wrapErrorFun);
};

internals.updateAccountCredential = function(credManager, updateAccountFunc, log, accountId, accountKey, credId, callback) {
  callback = callback || _.noop;

  var credName = accountKey;
  if (accountKey === 'facebookId') {
    credName = 'facebook';
  }

  async.series([
    function(callback) {
      credManager.createCredential(credName, credId, accountId, callback);
    },
    function(callback) {
      var data = {id : accountId};
      data[accountKey] = credId;

      return updateAccountFunc(data, {ReturnValues : 'UPDATED_OLD'}, callback);
    }
  ], function(err, results) {
    if(err) {
      credManager.removeCredential(credName, credId, accountId, function () {
        return callback(err);
      });
    } else {
      var oldAccountData = results[1];

      if(_.has(oldAccountData, accountKey) && !_.isNull(oldAccountData[accountKey])) {
        credManager.removeCredential(credName, oldAccountData[accountKey], accountId, function (err) {
          if (err) {
            log.info({err : err}, 'failed to remove old credential, rollback credential update');
            return callback(err);
          }
          return callback();
        });
      } else {
        return callback();
      }
    }
  });
};


internals.linkAccountWithProvider = function(updateAccountFunc, accountId, providerName, providerId, callback) {
  callback = callback || _.noop;

  var data = {id : accountId};
  if (providerName === 'facebook') {
    data.facebookId = providerId;
  }

  return updateAccountFunc(data, callback);
};

module.exports = function (credentialManger, logger) {
  var updateAccountFunc = _.partial(internals.update, logger);
  var updateAccountCredentialFunc = _.partial(internals.updateAccountCredential, credentialManger, updateAccountFunc, logger);

  var masterUpdateAccount = _.partial(internals.updateAccount, updateAccountCredentialFunc, updateAccountFunc);

  return {
    create : _.partial(internals.create, credentialManger, logger),
    update : masterUpdateAccount,
    remove : _.partial(internals.remove, credentialManger, logger),
    find : _.partial(internals.find, logger),
    linkAccountWithProvider : _.partial(internals.linkAccountWithProvider, masterUpdateAccount)
  };
};

