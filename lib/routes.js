'use strict';

module.exports = function(accountCtrl, tokenCtrl) {

  return [

    // Account endpoints
    { method: 'GET',  path: '/accounts/{accountId}', config: accountCtrl.get },
    { method: 'GET',  path: '/accounts', config: accountCtrl.search },
    { method: 'POST', path: '/accounts', config: accountCtrl.create },
    { method: 'PUT',  path: '/accounts/{accountId}', config: accountCtrl.update },

    // Auth token endpoints
    { method: 'POST', path: '/tokens', config: tokenCtrl.create },
    { method: 'GET' , path: '/tokens', config: tokenCtrl.verify }

  ];
};
