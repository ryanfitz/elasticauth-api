'use strict';

module.exports = function(accountCtrl, tokenCtrl) {

  return [

    // Account endpoints
    { method: 'POST', path: '/accounts', config: accountCtrl.create },
    { method: 'GET',  path: '/accounts/{accountId}', config: accountCtrl.get },

    // Auth token endpoints
    { method: 'POST', path: '/tokens', config: tokenCtrl.create },
    { method: 'GET' , path: '/tokens', config: tokenCtrl.verify }

  ];
};
