'use strict';

// Load modules

var Code   = require('code'),
    Lab    = require('lab'),
    _      = require('lodash'),
    uuid   = require('uuid'),
    helper = require('./test-helper');

// Declare internals

//var internals = {};

// Test shortcuts

var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var before = lab.before;
var expect = Code.expect;

describe('Accounts Controller', function () {
  var server;

  before(function (done) {
    server = helper.testApiServer(done);
  });

  describe('POST /accounts', function () {

    it('should return 201 created', function (done) {
      var data = {
        email : helper.randomEmail(),
        username : helper.randomUsername()
      };

      var request = { method: 'POST', url: '/accounts', payload : data};

      server.inject(request, function (res) {
        expect(res.statusCode).to.equal(201);

        return done();
      });
    });

    it('should return created account', function (done) {
      var data = {
        email : helper.randomEmail(),
        username : helper.randomUsername()
      };

      var request = { method: 'POST', url: '/accounts', payload : data};

      server.inject(request, function (res) {
        expect(res.result.accounts).to.have.length(1);

        return done();
      });
    });

    it('should return created account with metadata', function (done) {
      var data = {
        email : helper.randomEmail(),
        username : helper.randomUsername(),
        metadata : { foo : 'bar' }
      };

      var request = { method: 'POST', url: '/accounts', payload : data};

      server.inject(request, function (res) {
        expect(res.statusCode).to.equal(201);
        expect(res.result.accounts).to.have.length(1);

        var account = _.first(res.result.accounts);
        expect(account.metadata).to.be.a.object();

        return done();
      });
    });

    it('should return linked token', function (done) {
      var data = {
        email : helper.randomEmail(),
        username : helper.randomUsername()
      };

      var request = { method: 'POST', url: '/accounts', payload : data};

      server.inject(request, function (res) {
        expect(res.result.accounts).to.have.length(1);
        expect(res.result.linked.tokens).to.have.length(1);

        return done();
      });
    });

    it('should return created account with passed in id', function (done) {
      var accountId = uuid.v4();

      var data = {
        id : accountId,
        email : helper.randomEmail(),
        username : helper.randomUsername()
      };

      var request = { method: 'POST', url: '/accounts', payload : data};

      server.inject(request, function (res) {
        expect(res.statusCode).to.equal(201);
        expect(res.result.accounts).to.have.length(1);

        var account = _.first(res.result.accounts);

        expect(account.id).to.equal(accountId);

        return done();
      });
    });

  });

  describe('GET /accounts/{id}', function () {
    var accountId,
        token;

    before(function (done) {
      server.methods.createAccount(function (err, data) {
        expect(err).to.not.exist();
        expect(data).to.exist();
        expect(data.account).to.exist();

        token = data.token;
        expect(token).to.exist();

        accountId = data.account.id;

        return done();
      });
    });

    it('should return account without email', function (done) {
      var request = { method: 'GET', url: '/accounts/' + accountId};

      server.inject(request, function (res) {
        expect(res.statusCode).to.equal(200);
        expect(res.result.accounts).to.have.length(1);

        var account = _.first(res.result.accounts);
        expect(account.id).to.be.a.string();
        expect(account.href).to.be.a.string();
        expect(account.username).to.be.a.string();
        expect(account.email).to.not.exist();

        return done();
      });
    });

    it('should return account with email', function (done) {

      var request = { method: 'GET', url: '/accounts/' + accountId, headers : helper.authHeader(token) };

      server.inject(request, function (res) {
        expect(res.statusCode).to.equal(200);
        expect(res.result.accounts).to.have.length(1);

        var account = _.first(res.result.accounts);
        expect(account.id).to.be.a.string();
        expect(account.href).to.be.a.string();
        expect(account.username).to.be.a.string();
        expect(account.email).to.be.a.string();

        return done();
      });
    });

    it('should return 404 not found', function (done) {
      var request = { method: 'GET', url: '/accounts/9999999999'};

      server.inject(request, function (res) {
        expect(res.statusCode).to.equal(404);
        return done();
      });

    });

    it('should return error when attempting to use refresh token', function (done) {

      var request = { method: 'GET', url: '/accounts/' + accountId, headers : helper.authHeader(token, 'refresh') };

      server.inject(request, function (res) {
        expect(res.statusCode).to.equal(403);
        expect(res.result.accounts).to.not.exist();

        return done();
      });
    });

    it('should return account with specific field', function (done) {
      var request = { method: 'GET', url: '/accounts/' + accountId + '?fields=name'};

      server.inject(request, function (res) {
        expect(res.statusCode).to.equal(200);
        expect(res.result.accounts).to.have.length(1);

        var account = _.first(res.result.accounts);
        expect(account.id).to.be.a.string();
        expect(account.href).to.be.a.string();
        expect(account.name).to.be.a.string();
        expect(account.email).to.not.exist();
        expect(account.username).to.not.exist();
        expect(account.metadata).to.not.exist();

        return done();
      });
    });

    it('should return account without specific email field', function (done) {
      var request = { method: 'GET', url: '/accounts/' + accountId + '?fields=id,name,email'};

      server.inject(request, function (res) {
        expect(res.statusCode).to.equal(200);
        expect(res.result.accounts).to.have.length(1);

        var account = _.first(res.result.accounts);
        expect(account.id).to.be.a.string();
        expect(account.href).to.be.a.string();
        expect(account.name).to.be.a.string();
        expect(account.email).to.not.exist();
        expect(account.username).to.not.exist();
        expect(account.metadata).to.not.exist();

        return done();
      });
    });

    it('should return account with specific email field', function (done) {
      var request = { method: 'GET', url: '/accounts/' + accountId + '?fields=name,email', headers : helper.authHeader(token)};

      server.inject(request, function (res) {
        expect(res.statusCode).to.equal(200);
        expect(res.result.accounts).to.have.length(1);

        var account = _.first(res.result.accounts);
        expect(account.id).to.be.a.string();
        expect(account.href).to.be.a.string();
        expect(account.name).to.be.a.string();
        expect(account.email).to.be.a.string();
        expect(account.username).to.not.exist();
        expect(account.metadata).to.not.exist();

        return done();
      });
    });

  });

  describe('GET /accounts', function () {
    var account,
        token;

    before(function (done) {
      server.methods.createAccount(function (err, data) {
        expect(err).to.not.exist();
        expect(data).to.exist();

        token = data.token;
        account = data.account;

        return done();
      });
    });

    it('should return account matching email address', function (done) {
      var request = { method: 'GET', url: '/accounts?email=' + account.email};

      server.inject(request, function (res) {
        expect(res.statusCode).to.equal(200);
        expect(res.result.accounts).to.have.length(1);

        return done();
      });
    });

    it('should return account matching username', function (done) {
      var request = { method: 'GET', url: '/accounts?username=' + account.username};

      server.inject(request, function (res) {
        expect(res.statusCode).to.equal(200);
        expect(res.result.accounts).to.have.length(1);

        return done();
      });
    });

    it('should return account matching ids', function (done) {
      var request = { method: 'GET', url: '/accounts?ids=' + account.id};

      server.inject(request, function (res) {
        expect(res.statusCode).to.equal(200);
        expect(res.result.accounts).to.have.length(1);

        return done();
      });
    });

    it('should return 404 when no accounts match ids', function (done) {
      var request = { method: 'GET', url: '/accounts?ids=123,567'};

      server.inject(request, function (res) {
        expect(res.statusCode).to.equal(404);
        expect(res.result.accounts).to.not.exist();

        return done();
      });
    });

    it('should return accounts with partial match for ids', function (done) {
      var request = { method: 'GET', url: '/accounts?ids=' + account.id + ',12345'};

      server.inject(request, function (res) {
        expect(res.statusCode).to.equal(200);
        expect(res.result.accounts).to.have.length(1);

        return done();
      });
    });

    it('should return 404 when no matching email exists', function (done) {
      var request = { method: 'GET', url: '/accounts?email=test123@test.com'};

      server.inject(request, function (res) {
        expect(res.statusCode).to.equal(404);
        expect(res.result.accounts).to.not.exist();

        return done();
      });
    });

    it('should return 404 when no matching username exists', function (done) {
      var request = { method: 'GET', url: '/accounts?username=utest'};

      server.inject(request, function (res) {
        expect(res.statusCode).to.equal(404);
        expect(res.result.accounts).to.not.exist();

        return done();
      });
    });

    it('should return 400 bad request when passing both username and email', function (done) {
      var request = { method: 'GET', url: '/accounts?username=' + account.username + '&email=' + account.email};

      server.inject(request, function (res) {
        expect(res.statusCode).to.equal(400);
        expect(res.result.accounts).to.not.exist();

        return done();
      });
    });

    it('should return account by id with specific fields', function (done) {
      var request = { method: 'GET', url: '/accounts?ids=' + account.id + '&fields=name'};

      server.inject(request, function (res) {
        expect(res.statusCode).to.equal(200);
        expect(res.result.accounts).to.have.length(1);

        var acc = _.first(res.result.accounts);
        expect(acc.id).to.exist();
        expect(acc.name).to.exist();
        expect(acc.username).to.not.exist();
        expect(acc.email).to.not.exist();
        expect(acc.metadata).to.not.exist();

        return done();
      });
    });

    it('should return account matching username with specific fields', function (done) {
      var request = { method: 'GET', url: '/accounts?username=' + account.username + '&fields=username' };

      server.inject(request, function (res) {
        expect(res.statusCode).to.equal(200);
        expect(res.result.accounts).to.have.length(1);

        var acc = _.first(res.result.accounts);
        expect(acc.id).to.exist();
        expect(acc.username).to.exist();
        expect(acc.name).to.not.exist();
        expect(acc.email).to.not.exist();
        expect(acc.metadata).to.not.exist();


        return done();
      });
    });

  });

  describe('PUT /accounts/ID', function () {
    var account,
        token;

    before(function (done) {
      server.methods.createAccount(function (err, data) {
        expect(err).to.not.exist();
        expect(data).to.exist();

        token = data.token;
        account = data.account;

        return done();
      });
    });

    it('should update account name', function (done) {
      var data = {
        name : 'Foo Update'
      };


      var request = { method: 'PUT', url: '/accounts/' + account.id, payload : data, headers : helper.authHeader(token) };

      server.inject(request, function (res) {
        expect(res.statusCode).to.equal(200);
        expect(res.result.accounts).to.have.length(1);

        return done();
      });
    });

    it('should return 401 when no auth header is present', function (done) {
      var request = { method: 'PUT', url: '/accounts/' + account.id, payload : { name : 'Foo' }};

      server.inject(request, function (res) {
        expect(res.statusCode).to.equal(401);
        expect(res.result.accounts).to.not.exist();

        return done();
      });
    });

    it('should return 403', function (done) {
      var data = {
        name : 'Foo Update'
      };


      var request = { method: 'PUT', url: '/accounts/571293', payload : data, headers : helper.authHeader(token) };

      server.inject(request, function (res) {
        expect(res.statusCode).to.equal(403);
        expect(res.result.accounts).to.not.exist();

        return done();
      });
    });


  });

  describe('DELETE /accounts/ID', function () {
    var account,
        token;

    before(function (done) {
      server.methods.createAccount(function (err, data) {
        expect(err).to.not.exist();
        expect(data).to.exist();

        token = data.token;
        account = data.account;

        return done();
      });
    });

    it('should return 401 when no auth header is present', function (done) {
      var request = { method: 'DELETE', url: '/accounts/' + account.id };

      server.inject(request, function (res) {
        expect(res.statusCode).to.equal(401);
        expect(res.result.accounts).to.not.exist();

        return done();
      });
    });

    it('should return 403', function (done) {
      var request = { method: 'DELETE', url: '/accounts/571293', headers : helper.authHeader(token) };

      server.inject(request, function (res) {
        expect(res.statusCode).to.equal(403);
        expect(res.result.accounts).to.not.exist();

        return done();
      });
    });

    it('should remove account', function (done) {
      var request = { method: 'DELETE', url: '/accounts/' + account.id, headers : helper.authHeader(token) };

      server.inject(request, function (res) {
        expect(res.statusCode).to.equal(200);
        expect(res.result).to.not.exist();

        return done();
      });
    });
  });
});
