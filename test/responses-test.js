'use strict';

// Load modules

var Code          = require('code'),
    Lab           = require('lab'),
    url           = require('url'),
    jsonResponses = require('../lib/responses');

// Declare internals

//var internals = {};

// Test shortcuts

var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var before = lab.before;
var expect = Code.expect;

describe('tokens', function () {
  var responses;
  before(function (done) {
    var baseURL = 'http://test.com';
    responses = jsonResponses(baseURL);
    return done();
  });


  describe('#tokensResponse', function () {

    it('should return single token', function (done) {
      var expires = Date.now() + 60000;

      var token = {
        accountID : '123456',
        accessToken : 'access1234',
        refreshToken : 'refresh9876',
        type : 'Bearer',
        expires : expires
      };

      var currentPath = url.parse('http://test.com/tokens');
      var resp = responses.tokensResponse(token, null, currentPath);

      var expected = {
        links: { self: 'http://test.com/tokens' },
        tokens: [{
          href: 'http://test.com/tokens',
          access: 'access1234',
          expires: expires,
          type: 'Bearer',
          refresh: 'refresh9876',
          links : {
            self : 'http://test.com/tokens',
            account : {
              id : '123456',
              href : 'http://test.com/accounts/123456',
              type : 'account'
            }
          }
        }]
      };

      expect(resp).to.deep.equal(expected);
      return done();
    });

    it('should return multiple tokens', function (done) {
      var expires = Date.now() + 60000;

      var t1 = {
        accountID : '123456',
        accessToken : 'access1234',
        refreshToken : 'refresh9876',
        type : 'Bearer',
        expires : expires
      };

      var t2 = {
        accountID : '987',
        accessToken : 'anotherAccess',
        refreshToken : 'anotherRefresh',
        type : 'Bearer',
        expires : expires
      };

      var currentPath = url.parse('http://test.com/tokens');
      var resp = responses.tokensResponse([t1, t2], null, currentPath);

      var expected = {
        links: { self: 'http://test.com/tokens' },
        tokens: [{
          href: 'http://test.com/tokens',
          access: 'access1234',
          expires: expires,
          type: 'Bearer',
          refresh: 'refresh9876',
          links : {
            self : 'http://test.com/tokens',
            account : {
              id : '123456',
              href : 'http://test.com/accounts/123456',
              type : 'account'
            }
          }
        }, {
          href: 'http://test.com/tokens',
          access: 'anotherAccess',
          expires: expires,
          type: 'Bearer',
          refresh: 'anotherRefresh',
          links : {
            self : 'http://test.com/tokens',
            account : {
              id : '987',
              href : 'http://test.com/accounts/987',
              type : 'account'
            }
          }
        }]
      };

      expect(resp).to.deep.equal(expected);
      return done();
    });

    it('should return token with linked account', function (done) {
      var expires = Date.now() + 60000;
      var created = new Date();

      var token = {
        accountID : '12345',
        accessToken : 'access1234',
        refreshToken : 'refresh9876',
        type : 'Bearer',
        expires : expires
      };

      var account = {
        id : '12345',
        username : 'testdude',
        email : 'test@test.com',
        createdAt : created,
      };

      var opts = {
        linked : {accounts : account}
      };

      var currentPath = url.parse('http://test.com/tokens');
      var resp = responses.tokensResponse(token, opts, currentPath);

      var expected = {
        links: { self: 'http://test.com/tokens' },
        tokens: [{
          href: 'http://test.com/tokens',
          access: 'access1234',
          expires: expires,
          type: 'Bearer',
          refresh: 'refresh9876',
          links : {
            self : 'http://test.com/tokens',
            account : {
              id : '12345',
              href : 'http://test.com/accounts/12345',
              type : 'account'
            }
          }
        }],
        linked : {
          accounts : [{
            id : '12345',
            href: 'http://test.com/accounts/12345',
            username : 'testdude',
            email : 'test@test.com',
            createdAt : created.toISOString(),
            links : {
              self : 'http://test.com/accounts/12345'
            }
          }]
        }
      };

      expect(resp).to.deep.equal(expected);
      return done();
    });

  });

  describe('#accountsResponse', function () {

    it('should return single account', function (done) {
      var created = new Date();

      var account = {
        id : '12345',
        username : 'testdude',
        email : 'test@test.com',
        createdAt : created,
      };

      var currentPath = url.parse('http://test.com/accounts');
      var resp = responses.accountsResponse(account, null, currentPath);

      var expected = {
        links: { self: 'http://test.com/accounts' },
        accounts: [{
          id : '12345',
          href: 'http://test.com/accounts/12345',
          username : 'testdude',
          email : 'test@test.com',
          createdAt : created.toISOString(),
          links : {
            self: 'http://test.com/accounts/12345'
          }
        }]
      };

      expect(expected).to.deep.equal(resp);
      return done();
    });

    it('should return account with updated timestamp attribute', function (done) {
      var created = new Date(2015, 1, 1);
      var updated = new Date();

      var account = {
        id : '12345',
        username : 'testdude',
        email : 'test@test.com',
        createdAt : created,
        updatedAt : updated
      };

      var currentPath = url.parse('http://test.com/accounts');
      var resp = responses.accountsResponse(account, null, currentPath);

      var expected = {
        links: { self: 'http://test.com/accounts' },
        accounts: [{
          id : '12345',
          href: 'http://test.com/accounts/12345',
          username : 'testdude',
          email : 'test@test.com',
          createdAt : created.toISOString(),
          updatedAt : updated.toISOString(),
          links : {
            self : 'http://test.com/accounts/12345'
          }
        }]
      };

      expect(expected).to.deep.equal(resp);
      return done();
    });

    it('should return multiple accounts', function (done) {
      var c1 = new Date();
      var c2 = new Date(2015, 1, 1);

      var acc1 = {
        id : '12345',
        username : 'testdude',
        email : 'test@test.com',
        createdAt : c1,
      };

      var acc2 = {
        id : '9876',
        username : 'anotherdude',
        email : 'test2@test.com',
        createdAt : c2,
      };

      var currentPath = url.parse('http://test.com/accounts');
      var resp = responses.accountsResponse([acc1, acc2], null, currentPath);

      var expected = {
        links: { self: 'http://test.com/accounts' },
        accounts: [{
          id : '12345',
          href: 'http://test.com/accounts/12345',
          username : 'testdude',
          email : 'test@test.com',
          createdAt : c1.toISOString(),
          links : {
            self : 'http://test.com/accounts/12345'
          }
        }, {
          id : '9876',
          href: 'http://test.com/accounts/9876',
          username : 'anotherdude',
          email : 'test2@test.com',
          createdAt : c2.toISOString(),
          links : {
            self : 'http://test.com/accounts/9876'
          }
        }]
      };

      expect(expected).to.deep.equal(resp);
      return done();
    });

    it('should return account with linked token', function (done) {
      var created = new Date();
      var expires = Date.now();

      var account = {
        id : '12345',
        username : 'testdude',
        email : 'test@test.com',
        createdAt : created,
      };

      var token = {
        accountID : account.id,
        accessToken : 'access1234',
        refreshToken : 'refresh9876',
        type : 'Bearer',
        expires : expires
      };

      var currentPath = url.parse('http://test.com/accounts');

      var opts = {
        linked : {tokens : token}
      };

      var resp = responses.accountsResponse(account, opts, currentPath);

      var expected = {
        links: { self: 'http://test.com/accounts' },
        accounts: [{
          id : '12345',
          href: 'http://test.com/accounts/12345',
          email : 'test@test.com',
          username : 'testdude',
          createdAt : created.toISOString(),
          links : {
            self : 'http://test.com/accounts/12345'
          }
        }],
        linked : {
          tokens : [{
            href: 'http://test.com/tokens',
            access: 'access1234',
            expires: expires,
            type: 'Bearer',
            refresh: 'refresh9876',
            links : {
              self : 'http://test.com/tokens',
              account : {
                id : '12345',
                href : 'http://test.com/accounts/12345',
                type : 'account'
              }
            }
          }]
        }
      };

      expect(resp).to.deep.equal(expected);
      return done();
    });

  it('should return account with links template', function (done) {
      var baseURL = 'http://test.com';
      var accountLinks = {
        followers: 'http://test.com/accounts/${ account.id }/followers'
      };

      var responsesWithLinks = jsonResponses(baseURL, {accountLinks : accountLinks});

      var created = new Date();

      var account = {
        id : '12345',
        username : 'testdude',
        email : 'test@test.com',
        createdAt : created,
      };

      var currentPath = url.parse('http://test.com/accounts');
      var resp = responsesWithLinks.accountsResponse(account, null, currentPath);

      var expected = {
        links: { self: 'http://test.com/accounts' },
        accounts: [{
          id : '12345',
          href: 'http://test.com/accounts/12345',
          username : 'testdude',
          email : 'test@test.com',
          createdAt : created.toISOString(),
          links : {
            self: 'http://test.com/accounts/12345',
            followers: 'http://test.com/accounts/12345/followers'
          }
        }]
      };

      expect(expected).to.deep.equal(resp);
      return done();
    });
  });

});
