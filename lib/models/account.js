'use strict';

var vogels = require('vogels'),
    _      = require('lodash'),
    Joi    = require('joi');

var Account = vogels.define('ElasticAuth-account', {
  hashKey : 'id',
  timestamps : true,

  schema : {
    id            : vogels.types.uuid(),
    email         : Joi.string().email().required().trim().lowercase(),
    username      : Joi.string().min(3).max(60).required().trim(),
    usernameLower : Joi.string().min(3).max(60).required().trim().lowercase(), // this is for finding accounts
    name          : Joi.string().trim().lowercase(),
    roles         : vogels.types.stringSet().default(['user']),
    facebookId    : Joi.string(),
    metadata      : Joi.object().default({})
  },

  indexes : [
    { hashKey : 'email'         , name : 'emailIndex'   , type : 'global' },
    { hashKey : 'usernameLower' , name : 'usernameIndex', type : 'global' },
    { hashKey : 'facebookId'    , name : 'facebookIndex', type : 'global' }
  ]
});


Account.before('create', function (data, next) {
  if(_.has(data, 'username')) {
    data.usernameLower = data.username.toLowerCase();
  }

  return next(null, data);
});

Account.before('update', function (data, next) {
  if(_.has(data, 'username')) {
    data.usernameLower = data.username.toLowerCase();
  }

  return next(null, data);
});

module.exports = Account;
