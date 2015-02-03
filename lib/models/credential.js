var vogels = require('vogels'),
    Joi    = require('joi');

var Credential = vogels.define('ElasticAuth-credential', {
  hashKey : 'id',
  timestamps : true,

  schema : {
    id   : Joi.string().required(),
    //hash : Joi.string().required(),
    accountId : Joi.string().required(),
  },

});

module.exports = Credential;
