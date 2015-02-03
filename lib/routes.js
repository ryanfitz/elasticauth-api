'use strict';

module.exports = function(accountsCtrl) {
  return [

    { method: 'POST', path: '/accounts', config: accountsCtrl.create }

  ];
};
