'use strict';

// Load modules

var Code   = require('code'),
    Lab    = require('lab'),
    _      = require('lodash'),
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

  });

});
