
var vogels = require('vogels'),
    Joi    = require('joi');

var Account = vogels.define('ElasticAuth-account', {
  hashKey : 'id',
  timestamps : true,

  schema : {
    id         : vogels.types.uuid(),
    email      : Joi.string().email().required(),
    username   : Joi.string().min(3).max(60).required(),
    name       : Joi.string().trim().lowercase(),
    roles      : vogels.types.stringSet(),
    facebookId : Joi.string(),
    metadata : Joi.object()
  },

  indexes : [
    { hashKey : 'email'   , name : 'emailIndex'   , type : 'global' },
    { hashKey : 'username', name : 'usernameIndex', type : 'global' },
    { hashKey : 'facebookId', name : 'facebookIndex', type : 'global' }
  ]
});

module.exports = Account;
