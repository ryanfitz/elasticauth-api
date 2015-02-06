'use strict';

module.exports = function(accountsCtrl) {
  return [

    { method: 'POST', path: '/accounts', config: accountsCtrl.create },
    { method: 'GET',  path: '/accounts/{accountId}', config: accountsCtrl.get }

  ];
};
